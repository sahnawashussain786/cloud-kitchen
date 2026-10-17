import { MenuItem } from './models/MenuItem.js'
import { getSettings } from './routes/api.js'

// Dummy menu for Shahnaz Kitchen (prices in PKR)
const DUMMY_MENU = [
  ['Chicken Biryani', 'Fragrant basmati rice with spiced chicken and raita', 350, 'Biryani & Rice'],
  ['Beef Biryani', 'Slow-cooked beef layered with saffron rice', 400, 'Biryani & Rice'],
  ['Chicken Pulao', 'Yakhni pulao with tender chicken pieces', 320, 'Biryani & Rice'],
  ['Chicken Karahi (Half kg)', 'Desi ghee karahi with tomato, green chilli and ginger', 900, 'Karahi & Handi'],
  ['Mutton Karahi (Half kg)', 'Boneless mutton karahi cooked over open flame', 1500, 'Karahi & Handi'],
  ['Chicken Handi', 'Creamy handi gravy with boneless chicken', 950, 'Karahi & Handi'],
  ['Chicken Tikka', 'Charcoal-grilled marinated chicken leg piece', 350, 'BBQ & Grill'],
  ['Seekh Kabab (4 pcs)', 'Chargrilled minced beef kababs', 400, 'BBQ & Grill'],
  ['Malai Boti', 'Creamy grilled chicken cubes', 550, 'BBQ & Grill'],
  ['Nihari', 'Slow-cooked beef nihari with garnish', 450, 'Desi'],
  ['Haleem', 'Traditional mixed grain haleem, served with lemon and masala', 300, 'Desi'],
  ['Chargha (Half)', 'Lahori-style deep fried marinated whole chicken', 800, 'Desi'],
  ['Zinger Burger', 'Crispy fried fillet, mayo and lettuce with fries', 450, 'Fast Food'],
  ['Chicken Shawarma', 'Griddled wrap with garlic sauce', 250, 'Fast Food'],
  ['Chicken Chowmein', 'Stir-fried noodles with chicken and vegetables', 400, 'Fast Food'],
  ['Naan', 'Freshly baked tandoori naan', 40, 'Add-ons'],
  ['Raita & Salad', 'Yogurt raita with fresh garden salad', 60, 'Add-ons'],
  ['Kheer', 'Rice pudding with pistachio and cardamom', 200, 'Add-ons'],
]

export async function seedIfEmpty() {
  const count = await MenuItem.countDocuments()
  if (count === 0) {
    await MenuItem.insertMany(DUMMY_MENU.map(([name, description, price, category]) => ({ name, description, price, category })))
    console.log(`Seeded ${DUMMY_MENU.length} dummy menu items.`)
  }
  await getSettings() // ensures the singleton settings doc exists
}
