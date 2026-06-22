from .models import Chat, Message


def unread_messages(request):
    """Adds total_unread (personal + group chats) to every template context."""
    if not request.user.is_authenticated:
        return {"total_unread": 0}

    chats = Chat.objects.filter(users=request.user)
    total_unread = (
        Message.objects.filter(chat__in=chats)
        .exclude(sender=request.user)
        .exclude(readers=request.user)
        .count()
    )
    return {"total_unread": total_unread}