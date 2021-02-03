const neo4j = require('neo4j-driver')

const driver = neo4j.driver("bolt://neo4j:7687")
const session = driver.session()

var express = require('express');
var router = express.Router();

var redis = require('redis');
var client = redis.createClient(
  {
    host: 'redis-13459.c244.us-east-1-2.ec2.cloud.redislabs.com',
    port: 13459,
    password: 'PhCOixzP31ZkIEcTSjowF89HSliUMU82'
}); //creates a new client

client.on('connect', function() {
    console.log('connected');
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/topMovies', async (req, res) => {
  try{
    client.zrevrangebyscore('topmovies', 10, 0,'withscores', 'limit',0,5, function(err, reply) {
      res.send(reply);
    });

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/bottomMovies', async (req, res) => {
  try{
    client.zrangebyscore('topmovies', 0, 10, 'withscores', 'limit', 0, 5, function(err, reply) {
      res.send(reply);
    });

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/directorsMovies/:dirName', async (req, res) => {
  try{
    const dirName = req.params.dirName;

    const nodes=[];
    
    const result = await session.run(
        'MATCH (d:Persona {nombre: $dirNombre})-[:DIRIGIO]->(p:Pelicula) return p',
        {dirNombre: dirName}
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieFilter/:query', async (req, res) => {
  try{
    const query = req.params.query;

    const nodes=[];
    const result = await session.run(
      'MATCH (a:Pelicula) WHERE a.titulo STARTS WITH $query RETURN a',
      { query: query }
    )

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieActors/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:ACTUO_EN]-(a:Persona) return a',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push([r.get(0).properties.nombre, r.get(0).properties.foto])});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieDirector/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[:DIRIGIO]-(a:Persona) return a',
          { movie: movie}
      )
    //await driver.close()
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);

  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieRelations/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    
    const result = await session.run('MATCH (p:Pelicula {titulo: $movie})<-[]-(x) return x',
          { movie: movie}
      )
      
    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/actorsMovies/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre})-[:ACTUO_EN]->(p:Pelicula) return p',
      {acNombre: acName}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/actorInfo/:actor', async (req, res) => {
  try{
    const acName = req.params.actor;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Persona {nombre: $acNombre}) return a',
      {acNombre: acName}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});


router.get('/userInfo/:user', async (req, res) => {
  try{
    const usuario = req.params.user;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (a:Usuario {username: $usr}) return a',
      {usr: usuario}
    )

    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0).properties)});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/userInfoRedis/:user', async (req, res) => {
  try{
    const user = req.params.user;

    const nodes=[];

    client.get(user+":password", function(err, reply1) {
      nodes.push({"password": reply1})
      client.get(user+":mail", function(err, reply2) {
        nodes.push({"mail": reply2})
        client.get(user+":fecha", function(err, reply3) {
          nodes.push({"fecha": reply3})
          client.get(user+":genero", function(err, reply4) {
            nodes.push({"genero": reply4})
            res.send(nodes);
          });
        });
      });
    });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/createReview/:usuario/:review/:score/:movie', async (req, res) => {
  try{
    const usuario = req.params.usuario;
    const review = req.params.review;
    const score = req.params.score;
    const movie = req.params.movie;

    const nodes=[];
    
    const result = await session.run(
      'MATCH (u:Usuario),(p:Pelicula) WHERE u.username = $usr AND p.titulo = $movie CREATE (u)-[r:CALIFICA { score: toInteger($score), review:$review}]->(p) RETURN type(r), r.name',
          {usr: usuario, movie: movie, score: score, review: review}
      )
      
      
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/userReviews/:usuario', async (req, res) => {
  try{  
    const usuario = req.params.usuario;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula) return r, p',
          {usr: usuario}
      )
      //await driver.close()
      
      result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1).properties])});

  res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/modifyReview/:usuario/:review/:score/:movie', async (req, res) => {
  try{  
    const usuario = req.params.usuario;
    const movie = req.params.movie;
    const review = req.params.review;
    const score = req.params.score;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) set r.review = $rev, r.score = toInteger($score)',
          {usr: usuario, mov: movie, rev: review, score: score}
      )
    
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});

    client.zadd('topmovies', nodes[0], movie, function(err, reply) {
      console.log(err);
    });

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/deleteReview/:usuario/:movie', async (req, res) => {
  try{  
    const usuario = req.params.usuario;
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario {username: $usr})-[r:CALIFICA]->(p:Pelicula {titulo: $mov}) delete r',
          {usr: usuario, mov: movie}
      )
    const result2 = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
  
    result2.records.forEach(r =>{ nodes.push(r.get(0))});
    
    if(nodes[0]==null){
      client.zrem('topmovies', movie, function(err, reply) {
        console.log(err);
      });
    }
    else{
      client.zadd('topmovies', nodes[0], movie, function(err, reply) {
        console.log(err);
      });
    }
    

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});


router.get('/movieReviews/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (u:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return r, u.username',
      {movie: movie}
    )
    //await driver.close()

    result.records.forEach(r =>{ nodes.push([r.get(0).properties,r.get(1)])});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/movieScoreAvg/:movie', async (req, res) => {
  try{
    const movie = req.params.movie;

    const nodes=[];
    //const session = driver.session()
    const result = await session.run(
      'MATCH (:Usuario)-[r:CALIFICA]->(p:Pelicula {titulo: $movie}) return avg(r.score)',
      {movie: movie}
    )
    //await driver.close()

    result.records.forEach(r =>{ nodes.push(r.get(0))});

    res.send(nodes);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
  });

router.get('/registerUser/:username/:password/:mail/:genero/:fecha', async (req, res) => {
  try{
      const username = req.params.username;
      const password = req.params.password;
      const mail = req.params.mail;
      const genero = req.params.genero;
      const fecha = req.params.fecha;

      const nodes=[];

      const result = await session.run(
        'CREATE (:Usuario {username: $username, password:$password, mail:$mail, genero:$genero, fechaDeNacimiento:$fecha});',
            {username, password, mail, genero, fecha}
      )

      client.set(username+":password", password);
      client.set(username+":mail", mail);
      client.set(username+":fecha", fecha);
      client.set(username+":genero", genero);

      result.records.forEach(r =>{ nodes.push(r.get(0))});

      res.send(nodes);
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});


router.get('/editUser/:username/:password/:mail/:genero/:fecha', async (req, res) => {
  try{
      const username = req.params.username;
      const password = req.params.password;
      const mail = req.params.mail;
      const genero = req.params.genero;
      const fecha = req.params.fecha;

      const nodes=[];

      const result = await session.run(
        'match (n:Usuario {username: $username}) SET n.password=$password, n.genero=$genero, n.fechaDeNacimiento=$fecha, n.mail=$mail;',
            {username, password, mail, genero, fecha}
      )

      client.set(username+":password", password);
      client.set(username+":mail", mail);
      client.set(username+":fecha", fecha);
      client.set(username+":genero", genero);

      result.records.forEach(r =>{ nodes.push(r.get(0))});

      res.send(nodes);
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});


module.exports = router;
