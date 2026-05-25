'''
Файл, що відповідає за обробку WebSocket-подій.
Цей файл є аналогом views.py, тільки для асинхроноого підключення через WebSocket.
'''

import json
from channels.generic.websocket import AsyncWebsocketConsumer 
from .forms import MessageForm


class ChatConsumer(AsyncWebsocketConsumer):
    '''
    Клас для обробки WebSocket-подій пов'язаних з логікою чату
    '''

    async def connect(self):
        '''
        Метод-подія, що відпрацює при отриманні запиту на встановлення WebSocket-зв'язку від клієнта
        '''
        # Властивість, що зберігає ім'я групи (воно може бути будь-яким)
        self.room_group_name = 'test_group'
        # Додати клієнта до групи
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name 
        )
        # Прийняти з'єднання
        await self.accept()
        # Надіслати клієнту повідомлення про успішне з'єднання із сервером
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'connection is successful!'
        }))

    async def receive(self, text_data):
        '''
        Метод-подія, що відпрацює при отриманні повідомлення від клієнта
        '''
        # Надліслати повідомлення до групи
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                # Назва методу, що треба викликати
                'type':'chat_message',
                # Дані, що передаються у метод
                'text_data':text_data
            }
        )

    async def chat_message(self, event):
        '''
        Метод, що містить логіку для відправки 
        '''
        # Конвертувати надіслані дані у словник
        text_data_dict = json.loads(event['text_data'])
        # Створити об'єкт форми, що заповнена надісланими даними
        form = MessageForm(text_data_dict)
        # Якщо надіслані дані є валідними
        if form.is_valid():
            # Отримати повідомлення
            message = form.cleaned_data['message']
            # Надіслати повідомлення клієнту
            await self.send(text_data=json.dumps({
                'type':'chat',
                'message':message
            }))
        else:
            # Вивести помилку
            print('Error')