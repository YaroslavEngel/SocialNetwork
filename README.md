<div align="center">

# 🌐 Social Network

Навчальний проєкт соціальної мережі на Django · A learning project — a social network built with Django

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white)
![Channels](https://img.shields.io/badge/Django%20Channels-WebSocket-44B78B?logo=django&logoColor=white)
![License](https://img.shields.io/badge/license-Educational-lightgrey)

**🇬🇧 [English](#-english) · 🇺🇦 [Українська](#-українська)**

</div>

---

## 🇬🇧 English

### Table of contents
1. [Project goal](#1-project-goal)
2. [Team](#2-team)
3. [Table of contents](#table-of-contents)
4. [Modules & technologies](#4-modules--technologies)
5. [How to run the project](#5-how-to-run-the-project)
6. [Project structure (apps overview)](#6-project-structure-apps-overview)
7. [Conclusion](#7-conclusion)
8. [Language note](#8-language-note)

### 1. Project goal
This project is a **mini social network** built with Django: registration and login with email confirmation, a friends system, a personal news feed with posts/tags/likes, and real-time private and group chats over WebSocket.

It was built as a **learning project**, and that's exactly where its value lies for a beginner:

- It shows a **realistic multi-app Django architecture** (`home_app`, `user_app`, `post_app`, `chat_app`) instead of one giant app — a good first example of separating responsibilities.
- It covers a **full authentication flow** with a custom `User` model, email-based login, and a confirmation-code step — a very common real-world requirement that's rarely shown in basic tutorials.
- It demonstrates **Django Channels + WebSocket** (`AsyncWebsocketConsumer`) for live chat, alongside classic synchronous views — a good bridge between "regular Django" and asynchronous Django.
- It mixes **server-rendered templates**, **AJAX partial rendering** (`render_to_string` + JSON), and **vanilla JS** on the frontend, so a beginner can see several common integration patterns in one codebase.
- It contains real, relatable bugs and trade-offs (see [Conclusion](#7-conclusion)) — useful to study *and* to practice refactoring on.

### 2. Team

| Member | GitHub |
|---|---|
| Yaroslav (YaroslavEngel) | [github.com/YaroslavEngel](https://github.com/YaroslavEngel) |
| SigmaKriper007 | [github.com/SigmaKriper007](https://github.com/SigmaKriper007) |
| Maxim Andreev | [github.com/MaximAndreev2303](https://github.com/MaximAndreev2303) |
| Denis Havilo | [github.com/HaviloDenis](https://github.com/HaviloDenis) |

### 4. Modules & technologies

**Backend**
- Python 3 + **Django 6.0** — main web framework
- **Django Channels** + **Daphne** — ASGI server and WebSocket support for real-time chat
- **django.contrib.auth** with a **custom `User` model** (`AUTH_USER_MODEL = 'user_app.User'`, login by email)
- **SQLite** for local development (`db.sqlite3`); **PostgreSQL** supported via `psycopg2-binary` for production
- Django's built-in **email backend (SMTP)** for sending confirmation codes

**Frontend**
- Django **Templates** (server-side rendering) + a shared `base.html` layout
- **Vanilla JavaScript** (AJAX requests, WebSocket client, dynamic DOM updates) — no JS framework
- **CSS** with Google Fonts (Nunito) and custom SVG icon set

**Project apps (Django apps)**
- `home_app` — news feed / home page
- `user_app` — authentication, user profile, friends
- `post_app` — posts, tags, likes, views, images
- `chat_app` — private & group chats, WebSocket messaging

**Tooling**
- Django ORM & migrations
- Django admin panel
- Git / GitHub for version control

> 📌 Note: `requirements.txt` currently lists `Django`, `asgiref`, `sqlparse`, `psycopg2-binary` and `asarPy`, but the project actually also depends on **`channels`**, **`daphne`** and **`Pillow`** (required for image fields) — see the installation note below.

### 5. How to run the project

```bash
# 1. Clone the repository
git clone https://github.com/YaroslavEngel/SocialNetwork.git
cd SocialNetwork/SocialNetwork

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
pip install channels daphne pillow      # not yet listed in requirements.txt, but required

# 4. Configure email sending (for confirmation codes)
# Set your own SMTP credentials, ideally as environment variables,
# instead of hard-coding them in SocialNetwork/settings.py:
#   EMAIL_HOST_USER, EMAIL_HOST_PASSWORD

# 5. Apply database migrations
python manage.py migrate

# 6. (Optional) create an admin account
python manage.py createsuperuser

# 7. Run the development server (ASGI, required for WebSocket chat)
python manage.py runserver
```

Then open **http://127.0.0.1:8000/** in your browser.

> 🔐 **Security note:** the current `settings.py` in this repository contains a real, hard-coded Gmail address **and app password** for sending emails. Since this has already been committed to Git history, that password should be **rotated/revoked in your Google account immediately**, and going forward, secrets should be loaded from environment variables (e.g. via `python-decouple` or `django-environ`) and never committed.

### 6. Project structure (apps overview)

![Project architecture](images/architecture.png)

| App | Responsibility |
|---|---|
| **`home_app`** | The main news feed. Shows all posts (paginated, loaded via AJAX on scroll), and also assembles the home page context: pending friend requests and a preview of recent personal chats with unread-message counters. |
| **`user_app`** | Everything about the user: custom `User` model (login by **email**, `is_online` flag), registration/login forms, **email confirmation by code**, the **friendship system** (`Friendship` model — pending/accepted requests, friend search and filters), and public user profile pages. |
| **`post_app`** | Publishing content: the `Post` model with `Tag`s, image attachments (`PostImage`, with original + compressed versions), reactions (`PostLike`, `PostHeart`), view counters (`PostView`) and links (`PostLink`). Includes creating, listing and deleting posts. |
| **`chat_app`** | Real-time messaging built on **Django Channels**: one-to-one and **group chats** (`Chat`, with an avatar and admin for groups), `Message` model with read-receipts (`readers`) and image attachments (`MessageImage`). A `ChatConsumer` (`AsyncWebsocketConsumer`) handles live message delivery over WebSocket; regular views handle chat history, group creation/editing/leaving, and marking chats as read. |
| **`SocialNetwork`** (core) | The Django project itself: global `settings.py`, root `urls.py` routing requests to each app, and ASGI/WSGI entry points (`asgi.py`, `wsgi.py`) — the ASGI app is what enables WebSocket support for `chat_app`. |

### 7. Conclusion
Working on this project was a practical exercise in building a **multi-feature web application from scratch**, rather than following a single tutorial. It required combining several pieces that are normally taught separately: custom user authentication, a friends/relationships system, content publishing with media handling, and real-time communication with WebSockets — all inside one consistent Django project.

**What this project helped to practice / learn:**
- Structuring a Django project into independent, focused apps instead of one large app.
- Implementing a custom `User` model and an email + confirmation-code authentication flow.
- Modeling many-to-many and self-referential relationships (friendships, group chat membership).
- Mixing classic server-rendered views with AJAX (JSON responses, `render_to_string`) for a more dynamic UI without a JS framework.
- Working with Django Channels/Daphne to add asynchronous, real-time features (WebSocket chat) on top of a synchronous Django app.
- Recognizing real-world pitfalls — like committing secrets to `settings.py` or missing dependencies in `requirements.txt` — and how to avoid them.

**Possible directions for further development:**
- Move all secrets (email credentials, `SECRET_KEY`) to environment variables and rotate the exposed Gmail app password.
- Fix and complete `requirements.txt` (add `channels`, `daphne`, `Pillow`; remove unused entries like `asarPy` if not needed).
- Replace the in-memory channel layer with **Redis** (`channels_redis`) so chat works correctly with more than one server process/worker.
- Add automated tests (the `tests.py` files in each app are currently empty/minimal) and CI.
- Add notifications (likes, friend requests, new messages) and possibly push notifications.
- Improve search and filtering for posts and users, and add pagination/infinite scroll consistently across all list views.
- Containerize the project with Docker and add a deployment guide (Nginx + Daphne/Gunicorn + PostgreSQL + Redis).

### 8. Language note
This README is written in **two languages**: English (above) and Ukrainian (below), so it's accessible to both international and Ukrainian-speaking contributors/reviewers.

---

## 🇺🇦 Українська

### Зміст
1. [Мета створення проєкту](#1-мета-створення-проєкту)
2. [Склад команди](#2-склад-команди)
3. [Зміст](#зміст)
4. [Перелік модулів та технологій](#4-перелік-модулів-та-технологій)
5. [Як запустити проєкт в роботу](#5-як-запустити-проєкт-в-роботу)
6. [Зміст проєкту (огляд додатків)](#6-зміст-проєкту-огляд-додатків)
7. [Висновок по роботі](#7-висновок-по-роботі)
8. [Примітка щодо мов](#8-примітка-щодо-мов)

### 1. Мета створення проєкту
Цей проєкт — **навчальна соціальна мережа** на Django: реєстрація та вхід із підтвердженням email, система друзів, особиста стрічка з публікаціями (теги, лайки), а також приватні й групові чати в реальному часі через WebSocket.

Проєкт створювався як **навчальний**, і саме в цьому його користь для початківця:

- Він демонструє **реалістичну архітектуру Django-проєкту з кількома додатками** (`home_app`, `user_app`, `post_app`, `chat_app`) замість одного великого додатку — гарний приклад розділення відповідальності.
- Він охоплює **повний цикл авторизації**: власну модель `User`, вхід за email та крок підтвердження кодом — дуже поширена вимога в реальних проєктах, яку рідко показують у базових уроках.
- Він показує роботу з **Django Channels + WebSocket** (`AsyncWebsocketConsumer`) для чату в реальному часі поруч зі звичайними синхронними views — хороший «місток» між «звичайним» та асинхронним Django.
- Він поєднує **серверний рендеринг шаблонів**, **часткове AJAX-оновлення сторінки** (`render_to_string` + JSON) та **чистий JavaScript** на фронтенді — початківець бачить кілька поширених підходів до інтеграції в одному коді.
- У ньому є реальні, життєві недоліки й компроміси (див. [Висновок](#7-висновок-по-роботі)) — їх корисно як вивчати, так і тренуватися виправляти.

### 2. Склад команди

| Учасник | GitHub |
|---|---|
| Yaroslav (YaroslavEngel) | [github.com/YaroslavEngel](https://github.com/YaroslavEngel) |
| SigmaKriper007 | [github.com/SigmaKriper007](https://github.com/SigmaKriper007) |
| Maxim Andreev | [github.com/MaximAndreev2303](https://github.com/MaximAndreev2303) |
| Denis Havilo | [github.com/HaviloDenis](https://github.com/HaviloDenis) |

### 4. Перелік модулів та технологій

**Backend**
- Python 3 + **Django 6.0** — основний веб-фреймворк
- **Django Channels** + **Daphne** — ASGI-сервер і підтримка WebSocket для чату в реальному часі
- **django.contrib.auth** із **власною моделлю `User`** (`AUTH_USER_MODEL = 'user_app.User'`, вхід за email)
- **SQLite** для локальної розробки (`db.sqlite3`); підтримка **PostgreSQL** через `psycopg2-binary` для продакшну
- Вбудований **email-backend (SMTP)** Django для надсилання кодів підтвердження

**Frontend**
- Django **Templates** (серверний рендеринг) + спільний layout `base.html`
- **Чистий JavaScript** (AJAX-запити, WebSocket-клієнт, динамічне оновлення DOM) — без JS-фреймворку
- **CSS** із Google Fonts (Nunito) та власним набором SVG-іконок

**Додатки проєкту (Django apps)**
- `home_app` — стрічка новин / головна сторінка
- `user_app` — авторизація, профіль користувача, друзі
- `post_app` — публікації, теги, лайки, перегляди, зображення
- `chat_app` — приватні та групові чати, обмін повідомленнями через WebSocket

**Інструменти**
- ORM та міграції Django
- Адмін-панель Django
- Git / GitHub для контролю версій

> 📌 Примітка: у `requirements.txt` зараз вказані лише `Django`, `asgiref`, `sqlparse`, `psycopg2-binary` і `asarPy`, проте проєкт фактично також потребує **`channels`**, **`daphne`** та **`Pillow`** (необхідний для полів із зображеннями) — див. примітку нижче в розділі встановлення.

### 5. Як запустити проєкт в роботу

```bash
# 1. Клонуємо репозиторій
git clone https://github.com/YaroslavEngel/SocialNetwork.git
cd SocialNetwork/SocialNetwork

# 2. Створюємо і активуємо віртуальне середовище
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Встановлюємо залежності
pip install -r requirements.txt
pip install channels daphne pillow      # ще не вказані в requirements.txt, але потрібні

# 4. Налаштовуємо надсилання email (для кодів підтвердження)
# Вкажіть власні дані SMTP, бажано через змінні середовища,
# а не безпосередньо в SocialNetwork/settings.py:
#   EMAIL_HOST_USER, EMAIL_HOST_PASSWORD

# 5. Застосовуємо міграції бази даних
python manage.py migrate

# 6. (Опційно) створюємо адміністратора
python manage.py createsuperuser

# 7. Запускаємо сервер розробки (ASGI, потрібен для чату через WebSocket)
python manage.py runserver
```

Після цього відкрийте у браузері **http://127.0.0.1:8000/**.

> 🔐 **Примітка з безпеки:** у поточному `settings.py` цього репозиторію зашитий реальний Gmail-адрес **і пароль застосунку** для надсилання листів. Оскільки це вже потрапило в історію Git, цей пароль варто **негайно змінити/відкликати в налаштуваннях Google-акаунта**, а надалі зберігати секрети у змінних середовища (наприклад, через `python-decouple` чи `django-environ`) і не комітити їх у репозиторій.

### 6. Зміст проєкту (огляд додатків)

![Архітектура проєкту](images/architecture.png)

| Додаток | Відповідальність |
|---|---|
| **`home_app`** | Головна стрічка новин. Показує всі публікації (з пагінацією та довантаженням через AJAX), а також формує контекст головної сторінки: вхідні запити в друзі та превʼю останніх особистих чатів зі счетчиком непрочитаних повідомлень. |
| **`user_app`** | Усе, що стосується користувача: власна модель `User` (вхід за **email**, поле `is_online`), форми реєстрації/входу, **підтвердження email кодом**, **система дружби** (модель `Friendship` — запити в очікуванні/прийняті, пошук і фільтри друзів), а також публічні сторінки профілю користувача. |
| **`post_app`** | Публікація контенту: модель `Post` з тегами (`Tag`), зображеннями (`PostImage` — оригінал і стиснута версія), реакціями (`PostLike`, `PostHeart`), лічильником переглядів (`PostView`) та посиланнями (`PostLink`). Реалізовано створення, перелік і видалення публікацій. |
| **`chat_app`** | Обмін повідомленнями в реальному часі на базі **Django Channels**: особисті та **групові чати** (`Chat` — з аватаром і адміністратором для груп), модель `Message` з позначками про прочитання (`readers`) та зображеннями (`MessageImage`). `ChatConsumer` (`AsyncWebsocketConsumer`) відповідає за миттєву доставку повідомлень через WebSocket; звичайні views обробляють історію чату, створення/редагування/вихід із групи та позначення чату як прочитаного. |
| **`SocialNetwork`** (ядро) | Сам Django-проєкт: глобальні налаштування `settings.py`, кореневий `urls.py`, що розподіляє запити по додатках, а також точки входу ASGI/WSGI (`asgi.py`, `wsgi.py`) — саме ASGI-застосунок дозволяє працювати WebSocket-у в `chat_app`. |

### 7. Висновок по роботі
Робота над цим проєктом стала практичною вправою зі створення **повноцінного багатофункціонального веб-застосунку з нуля**, а не просто проходженням одного уроку. Довелося поєднати кілька речей, які зазвичай вивчають окремо: власну авторизацію користувачів, систему дружби/звʼязків, публікацію контенту з медіафайлами та обмін повідомленнями в реальному часі через WebSocket — і все це в межах одного цілісного Django-проєкту.

**Чого вдалося навчитися / що було відпрацьовано:**
- Структурувати Django-проєкт на окремі, сфокусовані додатки замість одного великого.
- Реалізовувати власну модель `User` та процес авторизації за email із кодом підтвердження.
- Моделювати звʼязки «багато-до-багатьох» та self-referential звʼязки (дружба, учасники групового чату).
- Поєднувати класичний серверний рендеринг із AJAX (JSON-відповіді, `render_to_string`) для більш динамічного інтерфейсу без JS-фреймворку.
- Працювати з Django Channels/Daphne, щоб додати асинхронні функції реального часу (WebSocket-чат) до синхронного Django-застосунку.
- Розпізнавати реальні «граблі» — наприклад, секрети в `settings.py` чи неповний `requirements.txt`, і розуміти, як їх уникати.

**Можливі напрямки подальшого розвитку:**
- Перенести всі секрети (дані для email, `SECRET_KEY`) у змінні середовища та змінити вже скомпрометований пароль Gmail.
- Виправити й доповнити `requirements.txt` (додати `channels`, `daphne`, `Pillow`; прибрати непотрібні залежності, як `asarPy`, якщо вони не використовуються).
- Замінити канальний шар в пам'яті (in-memory) на **Redis** (`channels_redis`), щоб чат коректно працював із кількома процесами/воркерами сервера.
- Додати автоматизовані тести (файли `tests.py` у кожному додатку наразі порожні/мінімальні) та CI.
- Додати сповіщення (лайки, запити в друзі, нові повідомлення), за можливості — push-сповіщення.
- Покращити пошук і фільтрацію публікацій та користувачів, уніфікувати пагінацію/довантаження на всіх сторінках зі списками.
- Контейнеризувати проєкт за допомогою Docker та додати інструкцію з деплою (Nginx + Daphne/Gunicorn + PostgreSQL + Redis).

### 8. Примітка щодо мов
Цей README написаний **двома мовами**: англійською (вище) та українською (нижче), щоб він був зрозумілим як міжнародній, так і україномовній аудиторії учасників/рецензентів.
