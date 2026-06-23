from django.db.models import Count
from user_app.models import Friendship
from chat_app.models import Chat


def friend_request(user, other_user):
    Friendship.objects.get_or_create(from_user=user, to_user=other_user, defaults={"status": "pending"})
    return {"label": "Очікування"}


def friend_reject(user, other_user):
    friendship = Friendship.objects.filter(from_user=other_user, to_user=user).first()
    if friendship:
        friendship.status = "dismissed"
        friendship.save()
    return {"remove": True}


def friend_accept(user, other_user):
    friendship = Friendship.objects.filter(from_user=other_user, to_user=user).first()
    if friendship:
        friendship.status = "accepted"
        friendship.save()
    return {"remove": True, "friend": True}


def friend_add_direct(user, other_user):
    friendship, created = Friendship.objects.get_or_create(
        from_user=user, to_user=other_user,
        defaults={"status": "accepted"}
    )
    if not created:
        friendship.status = "accepted"
        friendship.save()
    return {"success": True}


def friend_delete(user, other_user):
    # Видаляємо всі записи дружби між двома користувачами (в обидві сторони)
    Friendship.objects.filter(from_user=user, to_user=other_user).delete()
    Friendship.objects.filter(from_user=other_user, to_user=user).delete()

    # Спочатку знаходимо id чатів, де є ОБИДВА користувачі
    candidate_chat_ids = Chat.objects.filter(
        is_group=False,
        users=user
    ).filter(
        users=other_user
    ).values_list("id", flat=True)

    # Потім окремим запитом перевіряємо, що учасників у чаті рівно двоє
    private_chat = Chat.objects.filter(
        id__in=list(candidate_chat_ids)
    ).annotate(
        user_count=Count("users")
    ).filter(
        user_count=2
    ).first()

    if private_chat:
        private_chat.delete()

    return {"remove": True}