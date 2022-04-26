const express = require('express')()
const cors = require('cors')
const http = require('http').createServer(express);
const io = require('socket.io')(http, {
    cors: {
      origin: '*',
    }
  });
const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = 'mongodb+srv://xxxx'
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

express.use(cors());

var collection;

io.on('connection', (socket) => {
    console.log("io connection")
    socket.on('join', async (gameId) => {
        console.log("gameId: ", gameId)
        try {
            let result = collection.findOne({ '_id': gameId })
            if(!result) {
                await collection.insertOne({"_id": gameId, message: [] })
            }
            socket.join(gameId)
            socket.emit('joined', gameId)
            socket.activeRoom = gameId
        } catch(e) {
            console.log(e)
        }
    })
    socket.on('message', (message) => {
        console.log("message: ", message, socket.activeRoom)
        collection.updateOne({"_id": socket.activeRoom}, {
            "$push": {
                "message": message
            }
        })
        io.to(socket.activeRoom).emit('message', message)
    })
})

express.get('/chats', async (request, response) => {
    try {
        const result = await collection.findOne({ "_id": request.query.room})
        if(result) {
            response.send(result)
        } else {
            response.send({messages: []})
        }
    } catch(e) {
        console.log(e)
        response.status(500).send({ message: e.message })
    }

})


http.listen(3000, async () => {
    try {
        await client.connect(err => {
            if(err) {
                console.log(err)
                client.close();
            }
        });
        collection = client.db('gamedev').collection('chats');
        console.log('Listen on port :%s', http.address().port)
    } catch(e) {
        console.log(e)
    }
})