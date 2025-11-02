export async function GET() {
    const products = [
      { id: 'p1', name: 'Laptop', price: 1200, category: 'Electronics', stock: 5 },
      { id: 'p2', name: 'Desk Chair', price: 150, category: 'Furniture', stock: 3 },
      { id: 'p3', name: 'Phone', price: 900, category: 'Electronics', stock: 4 },
      { id: 'p4', name: 'Purse', price: 200, category: 'Apparel', stock: 5 },
      { id: 'p5', name: 'Watch', price: 150, category: 'Apparel', stock: 2 },
      { id: 'p6', name: 'Couch', price: 1000, category: 'Furniture', stock: 3 },
      { id: 'p7', name: 'Desk', price: 100, category: 'Furniture', stock: 6 },
      { id: 'p8', name: 'Speaker', price: 80, category: 'Electronics', stock: 4 },
      { id: 'p9', name: 'Headphones', price: 250, category: 'Electronics', stock: 3 },
      { id: 'p10', name: 'Shirt', price: 25, category: 'Apparel', stock: 10 },
      { id: 'p11', name: 'Pants', price: 20, category: 'Apparel', stock: 9 },
      { id: 'p12', name: 'Lamp', price: 40, category: 'Furniture', stock: 5 },

    ];
    return Response.json(products);
  }