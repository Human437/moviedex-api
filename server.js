require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const MOVIES = require('./movies-data.json')

const app = express()

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'
app.use(morgan(morganSetting))
app.use(helmet())
app.use(cors())

function validateBearerToken(req,res,next){
  const authToken = req.get('Authorization')
  const apiToken = process.env.API_TOKEN

  if(!authToken || authToken.split(' ')[1] !== apiToken){
    return res.status(401).json({error: 'Unauthorized request'})
  }

  next()
}

app.use(validateBearerToken)

function handleGetMovies(req,res){
  let {genre, country, avg_vote} = req.query;
  let results = MOVIES;

  if(genre){
    genre = genre.toLowerCase();
    results = results.filter(movie => movie.genre.toLowerCase().includes(genre))
  }

  if(country){
    country = country.toLowerCase();
    results = results.filter(movie => movie.country.toLowerCase().includes(country))
  }

  if(avg_vote){
    if(isNaN(Number(avg_vote))){
      return res.status(400).send('Invalid avg_vote provided')
    }else{
      avg_vote = Number(avg_vote);
    }
    results = results.filter(movie => Number(movie.avg_vote) >= avg_vote)
  }

  if (results.length === 0){
    res.send('No movies match the specified parameters')
  }else{
    res.json(results)
  }
}

app.get('/movie', handleGetMovies)

// 4 parameters in middleware, express knows to treat this as error handler
app.use((error, req, res, next) => {
  let response
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' }}
  } else {
    response = { error }
  }
  res.status(500).json(response)
})

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {})