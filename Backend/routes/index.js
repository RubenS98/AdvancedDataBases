const neo4j = require('neo4j-driver')

//Sesión de Neo4j
const driver = neo4j.driver("bolt://neo4j:7687")
const session = driver.session()

const express = require('express');
const router = express.Router();

const appHelp = require('../app')

/**
 * Para que el usuario inicie sesión.
 *
 * @param {string} username Nombre de usuario.
 * @param {string} password Contraseña del usuario.
 * @return {Status} Estado de respuesta que indica si la acción fue exitosa o si hubo algún problema.
 */
router.post('/login', async (req,res)=>{
  try{
    //Variables
    const usuario = req.body.username;
    const password = req.body.password;
    const nodes=[];

    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (a:Usuario {username: $usr}) return a',
      {usr: usuario}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});
    
    //Si contraseña e usuario son correctos, iniciar sesión
    if(nodes.length > 0 && nodes[0].password==password){
      sess=req.session;
      sess.username=req.body.username;
      sess.password=password;
      sess.mail=nodes[0].mail;
      sess.fecha=nodes[0].fechaDeNacimiento;
      sess.genero=nodes[0].genero;

      res.sendStatus(200);
    }
    //Si hay un problema, enviar error
    else{
      res.status(400).send("Login failed");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
  
});


router.get('/sessionCheck', (req,res)=>{
  sess=req.session;
  console.log(sess.username);
  console.log(sess.fecha);
  console.log(sess.mail);

  res.sendStatus(200);
});

/**
 * Para que el usuario se salga de su sesión.
 *
 * @param {string} username Nombre de usuario.
 * @param {string} password Contraseña del usuario.
 * @return {Status} Estado de respuesta que indica si la acción fue exitosa o si hubo algún problema.
 */
router.get("/logout", async (req, res) => {
  try{
    //Terminar sesión
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.sendStatus(200);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa las 5 películas mejor calificadas.
 *
 * @return {Array} Arreglo de objetos con el top 5 mejores películas.
 */
router.get('/topMovies', async (req, res) => {
  //Variables
  const nodes=[];
  let size;

  try{
    //Consulta Redis
    appHelp.client.zrevrangebyscore('topmovies', 10, 0,'withscores', 'limit', 0, 5, function(err, reply) {
      size=reply.length;
      console.log(size);
      for (let i=0; i<size; i+=2){
        nodes.push({"titulo": reply[i], "score": reply[i+1]});
      }
      res.send(nodes);
    });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa las 5 películas peor calificadas.
 *
 * @return {Array} Arreglo de objetos con el top 5 peores películas.
 */
router.get('/bottomMovies', async (req, res) => {
  //Variables
  const nodes=[];
  let size;

  try{
    //Consulta Redis
    appHelp.client.zrangebyscore('topmovies', 0, 10, 'withscores', 'limit', 0, 5, function(err, reply) {
      size=reply.length;
      for (let i=0; i<size; i+=2){
        nodes.push({"titulo": reply[i], "score": reply[i+1]});
      }
      res.send(nodes);
    });

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa las películas que han sido dirigidas por un director.
 *
 * @param {string} dirName Nombre del director.
 * @return {Array} Películas y sus atributos.
 */
router.get('/directorsMovies/:dirName', async (req, res) => {
  try{
    //Variables
    const dirName = req.params.dirName;
    const nodes=[];
    
    //Consulta Neo4j
    const result = await session.run(
        'MATCH (d:Persona {nombre: $dirNombre})-[:DIRIGIO]->(p:Pelicula) return p',
        {dirNombre: dirName}
    )

    result.records.forEach(r =>{ nodes.push({"titulo": r.get(0).properties.titulo, "poster": r.get(0).properties.poster, "descripcion":r.get(0).properties.descripcion})});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa las películas cuyos nombres empiezan con un string.
 *
 * @param {string} query texto para filtrar.
 * @return {Array} Películas y sus atributos.
 */
router.get('/movieFilter/:query', async (req, res) => {
  try{
    //Variables
    const query = req.params.query;
    const nodes=[];
    
    //Consulta Neo4j
    const result = await session.run(
      'MATCH (a:Pelicula) WHERE a.titulo STARTS WITH $query RETURN a',
      { query: query }
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa los actores que actuaron en una película.
 *
 * @param {string} movie título de la pelicula.
 * @return {Array} Actores y sus atributos.
 */
router.get('/movieActors/:movie', async (req, res) => {
  try{
    //Variables
    const movie = req.params.movie;
    const nodes=[];
    
    //Consulta Neo4j
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:ACTUO_EN]-(a:Persona) return a',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push([r.get(0).properties.nombre, r.get(0).properties.foto])});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa el director de una película.
 *
 * @param {string} movie Pelicula de la cual se desea conocer sus directores.
 * @return {Array} Arreglo con directores de la pelicula solicitada.
 */
router.get('/movieDirector/:movie', async (req, res) => {
  try{
    //Variables
    const movie = req.params.movie;
    const nodes=[];

    //Consulta a Neo4j
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:DIRIGIO]-(a:Persona) return a',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa los actores y directores de una película.
 *
 * @param {string} movie Pelicula de la cual se desea conocer sus actores.
 * @return {Array} Arreglo con actores y directores de la pelicula solicitada.
 */
router.get('/movieRelations/:movie', async (req, res) => {
  try{
    //Variables
    const movie = req.params.movie;
    const nodes=[];
    
    //Consulta a Neo4j
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[]-(x) return x',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa las peliculas en las que ha actuado un actor.
 *
 * @param {string} actor Actor del cual se desea conocer sus peliculas.
 * @return {Array} Arreglo con las peliculas del actor solicitado.
 */
router.get('/actorsMovies/:actor', async (req, res) => {
  try{
    //Variables
    const acName = req.params.actor;
    const nodes=[];

    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre})-[:ACTUO_EN]->(p:Pelicula) return p',
      {acNombre: acName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * Regresa la información de un actor.
 *
 * @param {string} actor Actor del cual se desea conocer su información
 * @return {Array} Arreglo con la información del actor solicitado.
 */
router.get('/actorInfo/:actor', async (req, res) => {
  try{
    //Variables
    const acName = req.params.actor;
    const nodes=[];

    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre}) return a',
      {acNombre: acName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

  /**
 * Información de un usuario. 
 *
 * @return {Array} Arreglo con la información del usuario que ha iniciado sesión.
 */
router.get('/userInfo', async (req, res) => {
  try{
    //Variables
    const nodes=[];
    sess=req.session;

    //Arreglo con variables de sesión
    nodes.push({"username":sess.username}, {"password":sess.password}, {"fecha":sess.fecha}, {"mail":sess.mail}, {"genero":sess.genero});
    
    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/userInfoGet/:user', async (req, res) => {
  try{
    //Variables
    const nodes=[];
    const user=req.params.user;

    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (a:Usuario {username: $user}) return a',
      {user}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

  /**
 * Crea una reseña y actualiza el promedio de la película en Neo4J y en Redis.
 *
 * @param {string} movie Película de la cual se desea crear la reseña.
 * @param {string} review Comentario de la película.
 * @param {integer} score Calificación de la película.
 * @return {Status} Estado de respuesta que indica si la acción se completó exitosamente o el error si hubo algún problema.
 */
router.post('/createReview', async (req, res) => {
  try{
    //Variables
    sess=req.session;
    const usuario = sess.username;
    const review = req.body.review;
    const score = req.body.score;
    const movie = req.body.movie;
    const nodes=[];
    
    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (u:Usuario),(p:Pelicula) WHERE u.username = $usr AND p.titulo = $movie CREATE (u)-[r:CALIFICA { score: toInteger($score), review:$review}]->(p) RETURN type(r), r.name',
          {usr: usuario, movie: movie, score: score, review: review}
      )
      
    //Consulta a Neo4j
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    //Actualización a Redis
    appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

  /**
 * Reseñas de un usuario. Regresa las reseñas que un usuario ha realizado a diferentes películas.
 *
 * @return {Array} Arreglo de reseñas de usuario.
 */
router.get('/userReviews', async (req, res) => {
  try{
    //Variables
    sess=req.session;
    const usuario = sess.username;
    const nodes=[];

    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
          {usr: usuario}
      )
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

  res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

  /**
 * Modifica una reseña y actualiza el promedio de la película en Neo4J y en Redis.
 *
 * @param {string} movie Película de la cual se desea modificar la reseña.
 * @param {string} review Nuevo comentario de la película.
 * @param {integer} score Nueva calificación de la película.
 * @return {Status} Estado de respuesta que indica si la acción se completó exitosamente o el error si hubo algún problema.
 */

router.post('/modifyReview', async (req, res) => {
  try{ 
    //Variables
    sess=req.session;
    const usuario = sess.username;
    const movie = req.body.movie;
    const review = req.body.review;
    const score = req.body.score;
    const nodes=[];
    
    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) set r.review = $rev, r.score = toInteger($score)',
          {usr: usuario, mov: movie, rev: review, score: score}
      )

    //Consulta a Neo4j
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    //Actualización a Redis
    appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

    /**
 * Elimina una reseña y actualiza el promedio de la película en Neo4J y en Redis.
 *
 * @param {string} movie Película de la cual se desea eliminar la reseña
 * @return {Status} Estado de respuesta que indica si la acción se completó exitosamente o el error si hubo algún problema.
 */
  
router.post('/deleteReview', async (req, res) => {
  try{
    //Variables
    sess=req.session;
    const usuario = sess.username;
    const movie = req.body.movie;
    const nodes=[];
    
    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) delete r',
          {usr: usuario, mov: movie}
      )
    //Consulta a Neo4j
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});
    
    if(nodes[0]==null){
      //Actualización a Redis
      appHelp.client.zrem('topmovies', movie, function(err, reply) {
        console.log(err);
      });
    }
    else{
      //Actualización a Redis
      appHelp.client.zadd('topmovies', nodes[0], movie, function(err, reply) {
        console.log(err);
      });
    }
  
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

   /**
   * Reseñas de una película. Regresa las reseñas de una película con los usuarios que las escribieron.
   *
   * @param {string} movie Película de la cual se desea obtener las reseñas
   * @return {Array} Arreglo de reseñas y usuarios
   */
router.get('/movieReviews/:movie', async (req, res) => {
  try{
    //Variables
    const movie = req.params.movie;
    const nodes=[];
    
    //Consulta a Neo4j
    const result = await session.run(
      'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
      {movie: movie}
    )

    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1)])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
   * Calificación promedio de una película. Suma y promedia las calificaciones de las reseñas de una película.
   *
   * @param {string} movie Película de la cual se desea calcular el promedio
   * @return {Array} Regresa un array con el dato promedio de la película
   */

  router.get('/movieScoreAvg/:movie', async (req, res) => {
    try{
      //Variables
      const movie = req.params.movie;
      const nodes=[];

      //Consulta a Neo4j
      const result = await session.run(
        'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
        {movie: movie}
      )
  
      result.records.forEach(r =>{ nodes.push(r.get(0))});
  
      res.send(nodes);
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
    });
  
    /**
   * Registro de un nuevo usuario. Inserta la información del nuevo usuario.
   *
   * @param {string} username Nombre de nuevo usuario.
   * @param {string} password Contraseña del nuevo usuario.
   * @param {string} mail Email del nuevo usuario.
   * @param {string} genero Genero del nuevo usuario.
   * @param {string} fecha Fecha de nacimiento del nuevo usuario.
   * @return {Status} Estado de respuesta que indica si la acción se completó exitosamente o el error si hubo algún problema.
   */
  router.post('/registerUser', async (req, res) => {
    try{
        //Variables
        const username = req.body.username;
        const password = req.body.password;
        const mail = req.body.mail;
        const genero = req.body.genero;
        const fecha = req.body.fecha;
  
        //Consulta a Neo4j
        const result = await session.run(
          'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
              {username, password, mail, genero, fecha}
        )
  
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
  });
  
  
  /**
   * Edición de un usuario. Actualiza la información del usuario en Neo4J y la información de la sesión en Redis
   *
   * @param {string} username Nombre de usuario actualizado.
   * @param {string} mail Email actualizado del usuario.
   * @param {string} genero Genero actualizado del usuario.
   * @param {string} fecha Fecha actualizada del usuario.
   * @return {Status} Estado de respuesta que indica si la acción se completó exitosamente o el error si hubo algún problema
   */
  router.post('/editUser', async (req, res) => {
    try{
        //Variables
        sess=req.session;
        const username = sess.username;
        const mail = req.body.mail;
        const genero = req.body.genero;
        const fecha = req.body.fecha;

        //Consulta a Neo4j
        const result = await session.run(
          'match (n:Usuario {username: $username}) SET n.genero=$genero, n.fechaDeNacimiento=$fecha, n.mail=$mail;',
              {username, mail, genero, fecha}
        )
        
        //Actualizar variables de sesion
        sess.mail=mail;
        sess.fecha=fecha;
        sess.genero=genero;
  
        res.sendStatus(200)
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
  });

module.exports = router;
