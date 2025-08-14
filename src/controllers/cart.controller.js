import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";


// @desc Add a product to the cart
const addToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user._id;
  console.log(req.user.id)
  console.log(req.user._id)
      if (quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero" });
      }
      
      // Validate product existence
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Validate product stock
      if (quantity > product.stock) {
        return res.status(400).json({ message: "Quantity exceeds available stock" });
      }
      
      
  
      // Check if user already has a cart
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        // Create a new cart if not exists
        cart = new Cart({ user: userId, items: [], totalPrice: 0 });
      }
  
      let addedPrice = 0;
      // Check if product already exists in cart
      const existingItem = cart.items.find(item => item.product.toString() === productId);
  
      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity;
        addedPrice = quantity * product.price; // Add the price of additional quantity
      } else {
        // Add new product to cart
        cart.items.push({ product: productId, quantity });
        addedPrice = quantity * product.price; // Add price of new product
      }
  
      // Update total price by adding only the new product's price
      cart.totalPrice += addedPrice;
  
      await cart.save();
  
      res.status(200).json({ message: "Product added to cart", cart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding product to cart", error });
    }
  };
  

// @desc Get user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "name price imageUrl description");
    console.log(cart)
    if (!cart) return res.status(404).json({ message: "Cart is empty" });

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart", error });
  }
};


// @desc Remove a product from the cart
const removeFromCart = async (req, res) => {
    try {
      const { productId } = req.params.id;
      const userId = req.user.id;
      // console.log(req.params.id);
      // console.log(req.body);
      // console.log(productId)
      let cart = await Cart.findOne({ user: userId }).populate("items.product","name price");
      if (!cart) return res.status(404).json({ message: "Cart not found" });
  
      // Find the item to remove
      const itemToRemove = cart.items.find(item => item.product._id.toString() === req.params.id);
    
      if (!itemToRemove) {
        return res.status(404).json({ message: "Product not found in cart" });
      }
      
      // Deduct only the removed item's price from totalPrice
      const deductedPrice = itemToRemove.quantity * itemToRemove.product.price;
      console.log(deductedPrice)
      cart.totalPrice -= deductedPrice;
      console.log(cart.totalPrice)
  
      // Remove the product from cart items
      cart.items = cart.items.filter(item => item.product._id.toString() !== req.params.id);
  
      await cart.save();
      
      res.status(200).json({ message: "Product removed from cart", cart });
    } catch (error) {
      res.status(500).json({ message: "Error removing product from cart", error });
    }
  };
  

// @desc Clear the cart
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing cart", error });
  }
};

export{
    addToCart,
    getCart,
    removeFromCart,
    clearCart
}