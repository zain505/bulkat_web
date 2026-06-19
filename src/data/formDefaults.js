export const emptySignup = {
  name: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export const emptyLogin = {
  emailOrMobile: '',
  password: '',
}

export const emptyCategoryForm = {
  name: '',
  nameUrdu: '',
  description: '',
  imageUrl: '',
  status: 'ACTIVE',
}

export const emptyProductForm = {
  categoryId: '',
  name: '',
  nameUrdu: '',
  sku: '',
  description: '',
  descriptionUrdu: '',
  imageUrl: '',
  images: [],
  imageFiles: [],
  videoUrl: '',
  videoFile: null,
  retailPrice: '',
  stockQuantity: '',
  status: 'ACTIVE',
  bulkPrices: [{ minQuantity: '2', unitPrice: '' }],
}
