from django.contrib import admin
from .models import Post, Tag, PostImage, PostLike, PostHeart, PostView, PostLink

admin.site.register(Post)
admin.site.register(Tag)
admin.site.register(PostImage)
admin.site.register(PostLike)
admin.site.register(PostHeart)
admin.site.register(PostView)
admin.site.register(PostLink)