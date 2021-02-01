LOAD CSV WITH HEADERS FROM "file:/Usuario.csv" AS row
CREATE (:Usuario {username: row.username, password: row.password, mail: row.mail, genero: row.genero,
fechaDeNacimiento: row.fechaDeNacimiento});

LOAD CSV WITH HEADERS FROM "file:/NodoActor.csv" AS row
CREATE (:Actor {nombre: row.nombre});

LOAD CSV WITH HEADERS FROM "file:/NodoDirector.csv" AS row
CREATE (:Director {dirNombre: row.dirNombre});

LOAD CSV WITH HEADERS FROM "file:/NodoPelicula.csv" AS row
CREATE (:Pelicula {titulo: row.titulo, anio: toInteger(row.anio), genero: row.genero});

LOAD CSV WITH HEADERS FROM "file:/Actuo_en.csv" AS row
MATCH (start:Actor {nombre: row.actor})
MATCH (end:Pelicula {titulo: row.peli})
MERGE (start)-[:ACTUO_EN]->(end);

LOAD CSV WITH HEADERS FROM "file:/Dirigio.csv" AS row
MATCH (start:Director {dirNombre: row.director})
MATCH (end:Pelicula {titulo: row.peli})
MERGE (start)-[:DIRIGIO]->(end);