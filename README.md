# vertotechnicalexercise
Technical Exercise for Verto Health

Deployed Instance: https://verto.trevorharvey.com


INSTALL:

NPM- npm install

Docker- docker-compose up


RUN APP:

npm start


default PORT=5000


API requires a MySQL database with schema 'vertoex' already created. After initial database is setup:

1)import vertodb.sql datadump file to access database

2)edit MySQL credential fields in db.js.

Test suite will execute prior to server connection.

