from .models import Chat, Message
from user_app.models import Friendship


def unread_messages(request):
    if not request.user.is_authenticated:
        return {"total_unread": 0, "pending_requests_count": 0}

    chats = Chat.objects.filter(users=request.user)
    total_unread = (
        Message.objects.filter(chat__in=chats)
        .exclude(sender=request.user)
        .exclude(readers=request.user)
        .count()
    )
    pending_requests_count = Friendship.objects.filter(
        to_user=request.user,
        status="pending"
    ).count()

    return {
        "total_unread": total_unread,
        "pending_requests_count": pending_requests_count,
    }