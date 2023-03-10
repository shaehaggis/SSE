const express = require('express');
const router = express.Router();
const rateLimiter = require("express-rate-limit");

//TO limit the number of request made to login an account
const dateLimiter = rateLimiter({
    //10 mins
    windowMs: 10 * 60 * 1000,
    
    //5 requests per wndowMS
    max: 50,
  
    message: "try again later"
  })

router.post('/confirm-date',dateLimiter, async (req, res) => {
    console.log(req.body.time);
    const query = `INSERT INTO date_confirmed (match_id,date,time) VALUES ($1,$2,$3);`;
    await req.pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        client.query(query, [req.body.matchID, req.body.date, req.body.time], (err, result) => {
            release();
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            // console.log(result.rows)
            res.sendStatus(200);
            // console.log(data);
        })
    })
});

router.post('/tested-positive', dateLimiter, async (req, res) => {

    await req.pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
       
        client.query('INSERT INTO covid_case (customer,date_of_infection) VALUES (1,$1)', [req.body.date], (err, result) => {
            release();
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            
            // console.log(data);
        })
    })

    const query = `SELECT customer.email FROM date_confirmed
    INNER JOIN match
    ON date_confirmed.match_id = match.match_id
    INNER JOIN customer
    ON match.person_2 = customer.user_id
    WHERE match.person_1 = 1 
    AND date_confirmed.date >= date ($1) - integer '14' 
    AND date_confirmed.date <= date ($1) 
    UNION
    SELECT customer.email FROM date_confirmed
    INNER JOIN match
    ON date_confirmed.match_id = match.match_id
    INNER JOIN customer
    ON match.person_1 = customer.user_id
    WHERE match.person_2 = 1 
    AND date_confirmed.date >= date ($1)  - integer '14' 
    AND date_confirmed.date <= date ($1) ;`;
    await req.pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        client.query(query, [req.body.date], (err, result) => {
            release();
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            console.log(result.rows);
            res.send(result.rows);
        })
    })
   
});

module.exports = router;