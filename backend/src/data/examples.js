export const defaultCurlExample = `curl -X GET "https://api.ecommerce.com/v1/products?category=electronics&brand=apple&page=1&limit=20" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example" \
-H "X-API-Key: sk_live_abc123" \
-H "Accept: application/json"`;

export const defaultResponses = [
  {
    code: '200',
    description: 'Successful response',
    body: {
      data: [
        {
          id: 'prod_123',
          name: 'iPhone 15 Pro',
          brand: 'Apple',
          category: 'electronics',
          price: 999.99,
          currency: 'USD',
          inStock: true,
          description: 'Latest iPhone model with advanced features',
          images: ['https://example.com/iphone1.jpg'],
          ratings: {
            average: 4.8,
            count: 1247
          },
          createdAt: '2023-09-12T10:30:00Z'
        }
      ],
      pagination: {
        page: 2,
        limit: 20,
        total: 150,
        totalPages: 8
      },
      filters: {
        category: 'electronics',
        brand: 'apple',
        priceRange: '500-2000'
      }
    }
  },
  {
    code: '400',
    description: 'Bad Request - Invalid query parameters',
    body: {
      error: 'invalid_parameters',
      message: 'Invalid query parameters provided',
      details: [
        {
          parameter: 'min_price',
          message: 'Must be a positive number',
          code: 'INVALID_FORMAT'
        },
        {
          parameter: 'page',
          message: 'Must be greater than 0',
          code: 'OUT_OF_RANGE'
        }
      ],
      timestamp: '2025-10-30T12:00:00Z'
    }
  }
];

export default { defaultCurlExample, defaultResponses };
