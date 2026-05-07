// =======================
// ПЕРЕКЛЮЧЕНИЕ ФОРМ
// =======================

$(document).on("click", ".tab, .back-btn", function(e) {
    e.preventDefault();

    $.get($(this).data("url"), function(data) {
        $(".auth-card").replaceWith(data);
    });
});


// =======================
// CSRF TOKEN
// =======================

function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
}


// =======================
// РЕГИСТРАЦИЯ + ЛОГИН
// =======================

$(document).on("submit", ".auth-form", function(e) {
    e.preventDefault();

    let form = $(this);

    $.ajax({
        url: form.attr("action"),
        type: "POST",
        data: form.serialize(),

        success: function(response) {

            // =======================
            // РЕГИСТРАЦИЯ
            // =======================

            if (response.message === "User Created") {

                let email = form.find('input[name="email"]').val();

                fetch("/user/send-code/", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken()
                    },

                    body: JSON.stringify({
                        email: email
                    })
                })

                .then(res => res.json())

                .then(data => {

                    return fetch("/user/form/confirm-email/");
                })

                .then(res => res.text())

                .then(html => {

                    document.querySelector(".auth-card").outerHTML = html;

                })

                .catch(err => {

                    console.error(err);
                    alert("Ошибка отправки кода");

                });
            }


            // =======================
            // ЛОГИН
            // =======================

            if (response.message === "Login Success") {

                // ПЕРВЫЙ ВХОД
                if (response.first_login) {

                    window.location.href =
                        response.redirect_url + "?first_login=1";

                }

                // ОБЫЧНЫЙ ВХОД
                else {

                    window.location.href =
                        response.redirect_url;

                }
            }


            // =======================
            // ОШИБКИ
            // =======================

            if (response.error) {

                console.log(response.error);
                alert("Ошибка формы");

            }
        }
    });
});


// =======================
// ПОДТВЕРЖДЕНИЕ EMAIL
// =======================

$(document).on("submit", ".confirm-form", function(e) {

    e.preventDefault();

    let inputs = document.querySelectorAll(".confirm-inputs input");

    let code = "";

    inputs.forEach(input => {
        code += input.value;
    });

    fetch("/user/verify-code/", {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },

        body: JSON.stringify({
            code: code
        })
    })

    .then(res => res.json())

    .then(data => {

        if (data.message === "Verified") {

            return fetch("/user/form/login/");
        }

        if (data.error) {

            throw new Error("Неверный код");

        }
    })

    .then(res => res.text())

    .then(html => {

        document.querySelector(".auth-card").outerHTML = html;

    })

    .catch(err => {

        alert(err.message);

    });
});
