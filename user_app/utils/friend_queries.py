from user_app.models import Friendship, User


def get_users_by_section(user, section):
    if section == "friends":
        sent = Friendship.objects.filter(from_user=user, status="accepted").values_list("to_user_id", flat=True)
        received = Friendship.objects.filter(to_user=user, status="accepted").values_list("from_user_id", flat=True)
        friend_ids = list(sent) + list(received)
        return User.objects.filter(id__in=friend_ids)
    elif section == "pending_sent":
        ids = Friendship.objects.filter(from_user=user, status="pending").values_list("to_user_id", flat=True)
        return User.objects.filter(id__in=ids)
    elif section == "pending_received":
        ids = Friendship.objects.filter(to_user=user, status="pending").values_list("from_user_id", flat=True)
        return User.objects.filter(id__in=ids)
    return User.objects.none()