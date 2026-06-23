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




    //  DONATION REQUESTS
    app.get('/api/donation-request', async (req, res) => {
      const bloodGroup = req.query.bloodGroup;
      const districts = req.query.recipientDistrict;
      const upazila = req.query.recipientUpazila;

      const query = {};
      if (bloodGroup) {
        query.bloodGroup = bloodGroup;
      }
      if (districts) {
        query.recipientDistrict = districts;
      }
      if (upazila) {
        query.recipientUpazila = upazila;
      }
      const cursor = donationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get('/api/single-request/:id', async (req, res) => {
      const { id } = req.params;
      console.log(req.params)
      const query = { _id: new ObjectId(id) };
      const result = await donationCollection.findOne(query);
      res.send(result);
    })



    // DONOR API

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
      return;

      const result = await createCollection.insertOne({
        ...data,
        status: 'pending'
      })

      res.send(result);
    });

    app.patch('/api/edit-request/:id', async (req, res) => {
      const { id } = req.params;

      const updateData = req.body;
      console.log(updateData);
      const result = await createCollection.updateOne(

        { _id: new ObjectId(id) },
        {
          $set: {

            recipientName: updateData.name,
            bloodGroup: updateData.bloodGroup,
            recipientDistrict: updateData.districts,
            donationDate: updateData.date
          },
        }
      );
      console.log(result);
      res.send(result);
    });

    app.delete('/api/delete-request/:id', async (req, res) => {
      const { id } = req.params;
      const result = await createCollection.deleteOne({ _id: new ObjectId(id) });
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