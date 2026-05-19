from user_app.models import User


def get_users_by_section(user, section, hidden_ids=None):
    if section == "requests":
        return User.objects.filter(
            sent_friendships__to_user=user,
            sent_friendships__status="pending"
        ).order_by("id")

    if section == "friends":
        sent_ids = list(user.sent_friendships.filter(status="accepted").values_list("to_user_id", flat=True))
        received_ids = list(user.received_friendships.filter(status="accepted").values_list("from_user_id", flat=True))
        return User.objects.filter(id__in=sent_ids + received_ids).order_by("id")

    if section == "recommendations":
        # Кому мы сами слали запрос (любой статус) — исключаем
        sent_ids = list(user.sent_friendships.values_list("to_user_id", flat=True))

        # Кто прислал нам pending — они в Запитах, не в рекомендациях
        pending_from_ids = list(
            user.received_friendships.filter(status="pending").values_list("from_user_id", flat=True)
        )
        # Кто уже друг (accepted с их стороны)
        accepted_from_ids = list(
            user.received_friendships.filter(status="accepted").values_list("from_user_id", flat=True)
        )

        exclude_ids = set(sent_ids + pending_from_ids + accepted_from_ids + [user.id])

        
        if hidden_ids:
            exclude_ids.update(hidden_ids)

        return User.objects.exclude(id__in=exclude_ids).order_by("id")