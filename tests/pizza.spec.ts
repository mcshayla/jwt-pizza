import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';


type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: { role: string}[];
}

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: 'diner' }] },  'a@jwt.com': {
      id: '1',
      name: '常用名字',
      email: 'a@jwt.com',
      password: 'admin',
      roles: [{ role: 'admin' }]
    } };

  const createdStores: Record<number, any[]> = {};

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    const requestData = route.request().postDataJSON();

    if(method === 'PUT') {
      const user = validUsers[requestData.email];
      if (!user || user.password !== requestData.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[requestData.email];
      // const loginRes = {
      //   user: loggedInUser,
      //   token: 'abcdef',
      // };
      const loginRes = {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          roles: user.roles
        },
        token: user.password === 'admin' 
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzcwNzQ0MzYwfQ.v9TvzErs0gUhAD1NYYXib9acStMLQCdBZtU5YxK0U88'
          : 'abcdef'
      };
      await route.fulfill({ json: loginRes });
    } else if (method === 'POST') {
      const newUser: User = {
      id: String(Object.keys(validUsers).length + 1),
      name: requestData.name,
      email: requestData.email,
      password: requestData.password,
      roles: [{ role: 'diner' }]
      };
      validUsers[requestData.email] = newUser;
      loggedInUser = newUser;
      await route.fulfill({ 
        json: { 
          user: newUser, 
          token: 'abcdef' 
        } 
    });
    } else if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ 
        json: { message: 'logout successful' } 
      });
    }
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });


  await page.route(/\/api\/franchise\/\d+\/store(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      const storeData = route.request().postDataJSON();
      const franchiseId = parseInt(route.request().url().split('/')[5]);
      const newStore = {
        id: Math.floor(Math.random() * 1000),
        name: storeData.name,
        franchiseId: franchiseId,
        totalRevenue: 0
      };
      
      if (!createdStores[franchiseId]) {
        createdStores[franchiseId] = [];
      }
      createdStores[franchiseId].push(newStore);
      
      await route.fulfill({ json: newStore });
    }
  });

  // Get user franchises: GET /api/franchise/:userId
  await page.route(/\/api\/franchise\/\d+$/, async (route) => {
    const method = route.request().method();
    const userId = parseInt(route.request().url().split('/')[5]);

    if (method === 'GET') {
      // Return franchises for this user with their stores
      const userFranchises = [
        {
          id: 1150,
          name: 'Test Franchise',
          admins: [{ id: 1, name: "常用名字", email: "a@jwt.com" }],
          stores: createdStores[1150] || []
        },
        {
          id: 1156,
          name: 'TEST TEST 4',
          admins: [{ id: 1, name: "常用名字", email: "a@jwt.com" }],
          stores: createdStores[1156] || [{id: 999, name: 'TEST STORE'}]
        },
      ];
      await route.fulfill({ json: userFranchises });
    }
  });

  //create franchise
  // await page.route('*/**/api/franchise', async (route) => {
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      const franchiseRes = {
      franchises: [
        {
          id: 1156,
          name: 'TEST TEST',
          admins: [
            {
              id: 1,
              name: "常用名字",
              email: "a@jwt.com"
            }
          ],
          stores: [{id: 999, name: 'TEST STORE'}],
        },
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
      more: false
    };
    await route.fulfill({ json: franchiseRes });
    } else if (method === 'POST') {
       expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: {
        "stores": [],
        "id": 1156,
        "name": "TEST TEST",
        "admins": [
          {
            "email": "a@jwt.com",
            "id": 1,
            "name": "常用名字"
          }
        ]
      } });
    }
   
  });
  

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Standard franchises and stores
  // await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
  //   const franchiseRes = {
  //     franchises: [
  //       {
  //         id: 2,
  //         name: 'LotaPizza',
  //         stores: [
  //           { id: 4, name: 'Lehi' },
  //           { id: 5, name: 'Springville' },
  //           { id: 6, name: 'American Fork' },
  //         ],
  //       },
  //       { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
  //       { id: 4, name: 'topSpot', stores: [] },
  //     ],
  //   };
  //   expect(route.request().method()).toBe('GET');
  //   await route.fulfill({ json: franchiseRes });
  // });

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const orderReq = route.request().postDataJSON();
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({ 
        json: {
          dinerId: Number(loggedInUser?.id) || 0,
          orders: [],
          page: 1
        }
      });
    } else if (method === 'POST') {

      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      }
     await route.fulfill({ json: orderRes });
    }
  });

  await page.goto('/');
}

async function loginAsAdmin(page: Page) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
}

async function loginAsDiner(page: Page) {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register as diner', async ({ page }) => {
  await basicInit(page);

  const uniqueEmail = `shayla-${Date.now()}@gmail.com`;
  await page.goto('http://localhost:5173/');

  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('shayla');
  await page.getByRole('textbox', { name: 'Full name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email address' }).fill(uniqueEmail);
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('shaylaPassword');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('link', { name: 's', exact: true }).click();
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
  await expect(page.getByRole('main')).toContainText(uniqueEmail);
  await expect(page.getByRole('main')).toContainText('shayla');
});

test('logout', async ({page}) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Register');
});

test('login as admin', async ({page}) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('link', { name: '常' }).click();
  await expect(page.getByRole('main')).toContainText('admin');
});

test('create Franchise', async ({page}) => {
  await basicInit(page);
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('TEST TEST');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('textbox', { name: 'Filter franchises' }).click();
  await page.getByRole('textbox', { name: 'Filter franchises' }).fill('TEST TEST');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('table')).toContainText('TEST TEST');
  await page.locator('body').click();
  
  // await page.getByRole('textbox', { name: 'Filter franchises' }).click();
  // await page.getByRole('textbox', { name: 'Filter franchises' }).fill('mytest');
  // await page.getByRole('button', { name: 'Submit' }).click();

});

test('new test', async ({page}) => {
  await basicInit(page);
  await loginAsAdmin(page);
  // await page.goto('http://localhost:5173/');
  // await page.getByRole('link', { name: 'Login' }).click();
  // await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  // await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  // await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  // await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  // await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  // await page.getByRole('cell', { name: 'Admin Franchise 02jlja5iu4' }).click();
  // await page.getByRole('cell', { name: '8imoozhida' }).click();
  // await page.getByRole('cell', { name: 'Admin Franchise 02jlja5iu4' }).click();
  // await page.getByRole('cell', { name: 'Admin Franchise 02jlja5iu4' }).click();
  // await page.getByRole('cell', { name: 'ng2j2gl9a4' }).click();
  await page.getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByRole('textbox', { name: 'store name' }).click();
  await page.getByRole('textbox', { name: 'store name' }).fill('TEST STORE');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('tbody')).toContainText('TEST STORE');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await page.getByRole('button', { name: 'Close' }).click();
});

// test('new test', async ({page}) => {
//   await page.goto('http://localhost:5173/');
//   await page.getByRole('link', { name: 'Login' }).click();
//   await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
//   await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
//   await page.getByRole('textbox', { name: 'Password' }).fill('admin');
//   await page.getByRole('textbox', { name: 'Password' }).press('Enter');
//   await page.getByRole('button', { name: 'Login' }).click();
//   await page.getByRole('link', { name: 'Admin' }).click();
//   await page.getByRole('button', { name: 'Add Franchise' }).click();
//   await page.getByRole('textbox', { name: 'franchise name' }).click();
//   await page.getByRole('textbox', { name: 'franchise name' }).fill('Test Test');
//   await page.getByRole('textbox', { name: 'franchise name' }).press('Tab');
//   await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
//   await page.getByRole('button', { name: 'Create' }).click();
//   await page.getByRole('button', { name: 'Create' }).click();
//   await page.getByRole('textbox', { name: 'franchise name' }).click();
//   await page.getByRole('textbox', { name: 'franchise name' }).fill('mytest');
//   await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
//   await page.getByRole('button', { name: 'Create' }).click();
//   await page.getByRole('textbox', { name: 'Filter franchises' }).click();
//   await page.getByRole('textbox', { name: 'Filter franchises' }).fill('mytest');
//   await page.getByRole('button', { name: 'Submit' }).click();
//   await page.getByRole('button', { name: 'Close' }).click();
//   await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
//   await expect(page.getByRole('main')).toContainText('TEST TEST');
//   await page.getByRole('button', { name: 'Close' }).click();
// });