# Проект Flash – интернет-магазин

## Выполненные задачи

- [x] Настройка сервера Node.js + Express
- [x] Подключение к PostgreSQL (таблицы users, products, cart)
- [x] Регистрация пользователей (уникальное имя, пароль 3-50 символов, телефон +992...)
- [x] Авторизация (JWT, хранение в localStorage)
- [x] Защита маршрутов (middleware auth)
- [x] Каталог товаров (загрузка с сервера, добавление в корзину)
- [x] Корзина (просмотр, изменение количества, удаление позиций, очистка)
- [x] Полный набор HTML-страниц с отдельными CSS (login, register, index, cart)
- [x] Адаптивная вёрстка (мобильные устройства, планшеты)
- [x] Минималистичный дизайн: чёрный, белый, лаймово-зелёный (#b4ff00)
- [x] Шрифт ANGST (подключён Inter как аналог)
- [x] Скругление углов 10px везде
- [x] Никаких смайликов, кроме иконок в брендинге (⚡)

- Те сайты которые файлы я сделал рядом будет галочка ✅ и если нет то галочки не будет!

> flash-market/ ✅
> ├── .env ✅
> ├── package.json ✅
> ├── server.js ✅
> ├── routes/ ✅
> │   └── api.js ✅
> ├── models/ ✅
> │   ├── db.js ✅
> │   ├── userModel.js ✅
> │   ├── productModel.js ✅
> │   └── cartModel.js ✅
> ├── middleware/ ✅
> │   └── auth.js ✅
> └── public/ ✅
>     ├── index.html ✅
>     ├── login.html ✅
>     ├── register.html ✅
>     ├── cart.html ✅
>     ├── product.html ✅         
>     ├── css/ ✅
>     │   ├── global.css ✅
>     │   ├── index.css ✅
>     │   ├── login.css ✅
>     │   ├── register.css ✅
>     │   ├── cart.css ✅
>     │   └── product.css ✅
>     └── js/ ✅
>         ├── index.js ✅
>         ├── login.js ✅
>         ├── register.js ✅
>         ├── cart.js ✅
>         └── product.js ✅

### PostgreSQL 
- Сделал 3 таблицы `cart` `products` `users`