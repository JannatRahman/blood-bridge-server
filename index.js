const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());



const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });

    const db = client.db('blood-bridge');
    const donationCollection = db.collection('donations');
    const paymentCollection = db.collection('payments');
    const requestCollection = db.collection('requests');
    const createCollection = db.collection('creates');

    app.get('/api/donation/:email', async (req, res) => {
      const { email } = req.params;;
      const result = await donationCollection.findOne({ email });
      res.send(result);
    })


    app.post('/api/donations', async (req, res) => {
      const { name, email, image, district, upazila, bloodGroup
      } = req.body

      const addData = {
        name,
        email,
        image,
        district,
        upazila,
        bloodGroup,
        createdAt: new Date(),
        status: 'pending'
      }

      const result = await donationCollection.insertOne(addData);
      return send(result);
    })

    app.patch('/api/donations/:id', async (req, res) => {
      const { id } = req.params;
      const { name, email, image, district, upazila, bloodGroup
      } = req.body

      const updateData = {
        name,
        email,
        image,
        district,
        upazila,
        bloodGroup,
      };
      const result = await donationCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,

          },
        }
      );
      res.send(result);
    });


    app.get('/api/my-request/:email', async (req, res) => {
      const { email } = req.params;;
      const result = await createCollection.find({
        requesterEmail: email
      }).toArray();
      res.send(result);
    })

    app.post('/api/create-request', async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await createCollection.insertOne({ ...data })

      res.send(result);
    })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});