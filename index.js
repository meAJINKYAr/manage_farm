const express = require('express');
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const Product = require('./models/product')
const Farm =  require('./models/farm')
const session =  require("express-session")
const flash = require('connect-flash')


const sessionOptions = {secret:'thisismysession', resave:false, saveUninitialised: false}

app.use(session(sessionOptions));
app.use(flash());

const categories = ['fruit', 'vegetable','dairy','fungi'];

mongoose.connect('mongodb://localhost:27017/farmStandTake2', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'))

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.get('/products',async (req,res)=>{
    const { category } = req.query;
    if(category){
        const products = await Product.find({category:category});
        res.render('products/index',{ products, category});
    }else{
        const products = await Product.find({})
        res.render('products/index',{ products, category: 'All' });
    }
})
// FARM ROUTES
app.use((req,res,next)=>{
    res.locals.messages = req.flash('success');
    next();
})

app.get('/farms',async (req,res)=>{
    const farms = await Farm.find({});
    res.render('farms/index',{ farms })
})

app.get('/farms/new',(req,res)=>{
    res.render('farms/new')
})

app.get('/farms/:id',async(req,res)=>{
    const farm = await Farm.findById(req.params.id).populate('products')
    res.render('farms/show',{farm});
})

app.post('/farms', async (req,res)=>{
    // res.send(req.body);
    const farm = new Farm(req.body);
    await farm.save();
    req.flash('success','New Farm Created!')
    res.redirect('/farms')
})
app.get('/farms/:id/products/new', async (req,res)=>{
    const { id } = req.params;
    const farm = await Farm.findById(id);
    res.render('products/new', {categories, farm});
})
app.post('/farms/:id/products', async (req,res)=>{
    //res.send(req.body);
    const { id } = req.params;
    const farm = await Farm.findById(id);
    const {name, price, category} = req.body;
    const product = new Product({name, price, category});
    farm.products.push(product);
    product.farm = farm;
    await farm.save();
    await product.save();
    //res.send(farm);
    res.redirect(`/farms/${id}`)
})

app.delete("/farms/:id", async (req,res)=>{
    const { id } = req.params;
    console.log('DELETING...')
    const farm = await Farm.findByIdAndDelete(id);
    res.redirect('/farms');
})

//PRODUCT ROUTES
app.get('/products/new', (req, res) => {
    res.render('products/new',{categories});
})

app.post('/products', async (req,res)=>{
    const newProduct = new Product(req.body);
    await newProduct.save();
    //console.log(newProduct);
    //res.send("product created");
    res.redirect(`/products/${newProduct._id}`)
});

app.get('/products/:id', async (req,res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate('farm','name');
    console.log(product);
    //console.log(product);
    res.render('products/show', { product });
})

app.get('/products/:id/edit', async (req,res)=>{
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render('products/edit',{ product, categories});
})

app.put('/products/:id', async (req,res)=>{
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id,req.body,{runValidators:true, new:true});
    console.log(req.body);
    res.redirect(`/products/${product._id}`);
})

app.delete('/products/:id', async (req,res)=>{
    const { id } = req.params;
    //res.send("You made it!!");
    const deletedProduct = await Product.findByIdAndDelete(id);
    console.log(deletedProduct);
    res.redirect('/products');
})

app.listen(3000,()=>{
    console.log("Connected on port 3000...");
})