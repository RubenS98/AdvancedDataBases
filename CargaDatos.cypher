LOAD CSV WITH HEADERS FROM "file:/Usuario.csv" AS row
CREATE (:Usuario {username: row.username, password: row.password, mail: row.mail, genero: row.genero,
fechaDeNacimiento: row.fechaDeNacimiento});

LOAD CSV WITH HEADERS FROM "file:/NodoActor.csv" AS row
CREATE (:Persona {nombre: row.nombre, nacimiento: row.nacimiento, edad: toInteger(row.edad), carrera: row.carrera, foto: row.foto, bio: row.bio});

LOAD CSV WITH HEADERS FROM "file:/NodoPelicula.csv" AS row
CREATE (:Pelicula {titulo: row.titulo, anio: toInteger(row.anio), genero: row.genero, poster: row.poster, banner: row.banner, descripcion: row.descripcion});

LOAD CSV WITH HEADERS FROM "file:/Actuo_en.csv" AS row
MATCH (start:Persona {nombre: row.actor})
MATCH (end:Pelicula {titulo: row.peli})
MERGE (start)-[:ACTUO_EN]->(end);

LOAD CSV WITH HEADERS FROM "file:/Dirigio.csv" AS row
MATCH (start:Persona {nombre: row.director})
MATCH (end:Pelicula {titulo: row.peli})
MERGE (start)-[:DIRIGIO]->(end);