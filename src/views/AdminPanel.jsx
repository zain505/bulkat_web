import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  ImagePlus,
  Pencil,
  Percent,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Truck,
  Users,
  Video,
  XCircle,
} from 'lucide-react'
import { emptyCategoryForm, emptyProductForm } from '../data/formDefaults'
import { translateStatus } from '../i18nCore'
import { useI18n } from '../useI18n'
import {
  errorMessage,
  formatMoney,
  getLocalizedCategoryName,
  getLocalizedName,
  getLocalizedProductName,
} from '../utils/commerce'

const MAX_PRODUCT_IMAGES = 5
const MAX_PRODUCT_IMAGE_BYTES = 1024 * 1024
const MAX_PRODUCT_VIDEO_BYTES = 10 * 1024 * 1024

function createProductFormState(overrides = {}) {
  return {
    ...emptyProductForm,
    bulkPrices: emptyProductForm.bulkPrices.map((rule) => ({ ...rule })),
    images: [],
    imageFiles: [],
    videoUrl: '',
    videoFile: null,
    ...overrides,
  }
}

function createSettingsFormState(settings = {}) {
  return {
    taxPercent: String(settings.taxPercent ?? 5),
    deliveryCharge: String(settings.deliveryCharge ?? 250),
    freeDeliveryOver: String(settings.freeDeliveryOver ?? 10000),
  }
}

function validateProductMedia(productForm, t) {
  const imageCount = productForm.images.length + productForm.imageFiles.length

  if (imageCount < 1) {
    return t('admin.productImageRequired')
  }

  if (imageCount > MAX_PRODUCT_IMAGES) {
    return t('admin.productImageLimit', { count: MAX_PRODUCT_IMAGES })
  }

  const invalidImage = productForm.imageFiles.find((file) => !file.type.startsWith('image/'))
  if (invalidImage) {
    return t('admin.productImageType')
  }

  const oversizedImage = productForm.imageFiles.find((file) => file.size > MAX_PRODUCT_IMAGE_BYTES)
  if (oversizedImage) {
    return t('admin.productImageSize')
  }

  if (productForm.videoFile && !productForm.videoFile.type.startsWith('video/')) {
    return t('admin.productVideoType')
  }

  if (productForm.videoFile && productForm.videoFile.size > MAX_PRODUCT_VIDEO_BYTES) {
    return t('admin.productVideoSize')
  }

  return ''
}

function productFormToFormData(productForm, categories) {
  const formData = new FormData()
  const fields = {
    categoryId: Number(productForm.categoryId || categories[0]?.id),
    name: productForm.name,
    nameUrdu: productForm.nameUrdu,
    sku: productForm.sku,
    description: productForm.description,
    descriptionUrdu: productForm.descriptionUrdu,
    retailPrice: Number(productForm.retailPrice),
    stockQuantity: Number(productForm.stockQuantity),
    status: productForm.status,
  }

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value)
  })
  formData.append('images', JSON.stringify(productForm.images))
  formData.append('videoUrl', productForm.videoUrl || '')
  formData.append('bulkPrices', JSON.stringify(productForm.bulkPrices))
  productForm.imageFiles.forEach((file) => formData.append('images', file))

  if (productForm.videoFile) {
    formData.append('video', productForm.videoFile)
  }

  return formData
}

function AdminPanel({
  apiRequest,
  categories,
  products,
  reloadCatalog,
  activeTab = 'catalog',
  onTabChange = () => {},
  adminAccess = {},
  commerceSettings = {},
  onSettingsSaved = () => {},
}) {
  const { language, locale, t } = useI18n()
  const tab = activeTab
  const [permissions, setPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [categoryEditingId, setCategoryEditingId] = useState(null)
  const [productForm, setProductForm] = useState(() => createProductFormState())
  const [productEditingId, setProductEditingId] = useState(null)
  const [productMediaInputKey, setProductMediaInputKey] = useState(0)
  const [imageFilePreviews, setImageFilePreviews] = useState([])
  const [videoFilePreview, setVideoFilePreview] = useState('')
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissionCodes: [] })
  const [roleEditingId, setRoleEditingId] = useState(null)
  const [userRoleSelection, setUserRoleSelection] = useState({})
  const [settingsForm, setSettingsForm] = useState(() => createSettingsFormState(commerceSettings))
  const [settingsSaving, setSettingsSaving] = useState(false)

  const loadAdmin = useCallback(async () => {
    try {
      if (adminAccess.roles) {
        const [permissionData, roleData] = await Promise.all([
          apiRequest('get', '/admin/permissions'),
          apiRequest('get', '/admin/roles'),
        ])

        setPermissions(permissionData.permissions)
        setRoles(roleData.roles)
      } else {
        setPermissions([])
        setRoles([])
      }

      if (adminAccess.users) {
        const userData = await apiRequest('get', '/admin/users')
        setUsers(userData.users)
      } else {
        setUsers([])
      }

      setMessage('')
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }, [adminAccess.roles, adminAccess.users, apiRequest])

  useEffect(() => {
    loadAdmin()
  }, [loadAdmin])

  const loadSettings = useCallback(async () => {
    if (!adminAccess.settings) return

    try {
      const data = await apiRequest('get', '/admin/settings')
      setSettingsForm(createSettingsFormState(data.settings))
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }, [adminAccess.settings, apiRequest])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (!adminAccess.catalog) return

    reloadCatalog()
  }, [adminAccess.catalog, reloadCatalog])

  useEffect(() => {
    setSettingsForm(createSettingsFormState(commerceSettings))
  }, [commerceSettings])

  useEffect(() => {
    const next = {}
    users.forEach((user) => {
      next[user.id] = user.roles.map((role) => role.id)
    })
    setUserRoleSelection(next)
  }, [users])

  useEffect(() => {
    const previews = productForm.imageFiles.map((file) => URL.createObjectURL(file))
    setImageFilePreviews(previews)

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview))
  }, [productForm.imageFiles])

  useEffect(() => {
    if (!productForm.videoFile) {
      setVideoFilePreview('')
      return undefined
    }

    const preview = URL.createObjectURL(productForm.videoFile)
    setVideoFilePreview(preview)

    return () => URL.revokeObjectURL(preview)
  }, [productForm.videoFile])

  const submitCategory = async (event) => {
    event.preventDefault()
    try {
      if (categoryEditingId) {
        await apiRequest('put', `/categories/${categoryEditingId}`, categoryForm)
        setMessage(t('admin.categoryUpdated'))
      } else {
        await apiRequest('post', '/categories', categoryForm)
        setMessage(t('admin.categoryCreated'))
      }
      setCategoryForm(emptyCategoryForm)
      setCategoryEditingId(null)
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const editCategory = (category) => {
    setCategoryEditingId(category.id)
    setCategoryForm({
      name: category.name,
      nameUrdu: category.nameUrdu || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      status: category.status,
    })
  }

  const changeCategoryStatus = async (category, status) => {
    try {
      await apiRequest('patch', `/categories/${category.id}/status`, { status })
      setMessage(t('admin.categoryStatusUpdated'))
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const deleteCategory = async (category) => {
    try {
      await apiRequest('delete', `/categories/${category.id}`)
      setMessage(t('admin.categoryDeleted'))
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    const mediaError = validateProductMedia(productForm, t)

    if (mediaError) {
      setMessage(mediaError)
      return
    }

    const payload = productFormToFormData(productForm, categories)

    try {
      if (productEditingId) {
        await apiRequest('put', `/products/${productEditingId}`, payload)
        setMessage(t('admin.productUpdated'))
      } else {
        await apiRequest('post', '/products', payload)
        setMessage(t('admin.productCreated'))
      }
      setProductForm(createProductFormState())
      setProductEditingId(null)
      setProductMediaInputKey((current) => current + 1)
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const editProduct = (product) => {
    setProductEditingId(product.id)
    setProductForm({
      categoryId: String(product.categoryId),
      name: product.name,
      nameUrdu: product.nameUrdu || '',
      sku: product.sku,
      description: product.description || '',
      descriptionUrdu: product.descriptionUrdu || '',
      imageUrl: product.imageUrl || '',
      images: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [],
      imageFiles: [],
      videoUrl: product.videoUrl || '',
      videoFile: null,
      retailPrice: String(product.retailPrice),
      stockQuantity: String(product.stockQuantity),
      status: product.status,
      bulkPrices: product.bulkPrices?.length
        ? product.bulkPrices.map((rule) => ({
            minQuantity: String(rule.minQuantity),
            unitPrice: String(rule.unitPrice),
          }))
        : [{ minQuantity: '2', unitPrice: '' }],
    })
    setProductMediaInputKey((current) => current + 1)
  }

  const addProductImageFiles = (files) => {
    const selectedFiles = Array.from(files || [])
    const remainingSlots = MAX_PRODUCT_IMAGES - productForm.images.length - productForm.imageFiles.length

    if (remainingSlots <= 0) {
      setMessage(t('admin.productImageLimit', { count: MAX_PRODUCT_IMAGES }))
      return
    }

    const acceptedFiles = selectedFiles.slice(0, remainingSlots)

    if (acceptedFiles.length < selectedFiles.length) {
      setMessage(t('admin.productImageLimit', { count: MAX_PRODUCT_IMAGES }))
    }

    setProductForm({
      ...productForm,
      imageFiles: [...productForm.imageFiles, ...acceptedFiles],
    })
  }

  const removeExistingProductImage = (index) => {
    setProductForm({
      ...productForm,
      images: productForm.images.filter((_, imageIndex) => imageIndex !== index),
    })
  }

  const removeNewProductImage = (index) => {
    setProductForm({
      ...productForm,
      imageFiles: productForm.imageFiles.filter((_, imageIndex) => imageIndex !== index),
    })
  }

  const setProductVideoFile = (file) => {
    if (!file) {
      return
    }

    setProductForm({ ...productForm, videoFile: file, videoUrl: '' })
  }

  const removeProductVideo = () => {
    setProductForm({ ...productForm, videoFile: null, videoUrl: '' })
    setProductMediaInputKey((current) => current + 1)
  }

  const changeProductStatus = async (product, status) => {
    try {
      await apiRequest('patch', `/products/${product.id}/status`, { status })
      setMessage(t('admin.productStatusUpdated'))
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const deleteProduct = async (product) => {
    try {
      await apiRequest('delete', `/products/${product.id}`)
      setMessage(t('admin.productDeleted'))
      reloadCatalog()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const submitRole = async (event) => {
    event.preventDefault()
    try {
      if (roleEditingId) {
        await apiRequest('put', `/admin/roles/${roleEditingId}`, roleForm)
        setMessage(t('admin.roleUpdated'))
      } else {
        await apiRequest('post', '/admin/roles', roleForm)
        setMessage(t('admin.roleCreated'))
      }
      setRoleForm({ name: '', description: '', permissionCodes: [] })
      setRoleEditingId(null)
      loadAdmin()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const assignRoles = async (userId) => {
    try {
      await apiRequest('put', `/admin/users/${userId}/roles`, {
        roleIds: userRoleSelection[userId] || [],
      })
      setMessage(t('admin.userRolesUpdated'))
      loadAdmin()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const updateUserStatus = async (user, status) => {
    try {
      await apiRequest('patch', `/admin/users/${user.id}/status`, {
        status,
        adminInactiveNote: status === 'INACTIVE' ? t('admin.disabledNote') : '',
      })
      setMessage(t('admin.userStatusUpdated'))
      loadAdmin()
    } catch (error) {
      setMessage(errorMessage(error))
    }
  }

  const submitSettings = async (event) => {
    event.preventDefault()
    setSettingsSaving(true)

    try {
      const data = await apiRequest('put', '/admin/settings', {
        taxPercent: Number(settingsForm.taxPercent),
        deliveryCharge: Number(settingsForm.deliveryCharge),
        freeDeliveryOver: Number(settingsForm.freeDeliveryOver),
      })
      setSettingsForm(createSettingsFormState(data.settings))
      onSettingsSaved(data.settings)
      setMessage(t('admin.settingsUpdated'))
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setSettingsSaving(false)
    }
  }

  const toggleRolePermission = (permissionCode) => {
    const exists = roleForm.permissionCodes.includes(permissionCode)
    setRoleForm({
      ...roleForm,
      permissionCodes: exists
        ? roleForm.permissionCodes.filter((code) => code !== permissionCode)
        : [...roleForm.permissionCodes, permissionCode],
    })
  }

  const toggleUserRole = (userId, roleId) => {
    const current = userRoleSelection[userId] || []
    const exists = current.includes(roleId)
    setUserRoleSelection({
      ...userRoleSelection,
      [userId]: exists ? current.filter((id) => id !== roleId) : [...current, roleId],
    })
  }

  return (
    <section className="adminShell">
      <div className="sectionTitle">
        <ShieldCheck size={22} />
        <h1>{t('admin.title')}</h1>
      </div>
      <div className="segmented">
        {adminAccess.catalog && (
          <button className={tab === 'catalog' ? 'active' : ''} type="button" onClick={() => onTabChange('catalog')}>
            {t('admin.catalog')}
          </button>
        )}
        {adminAccess.roles && (
          <button className={tab === 'roles' ? 'active' : ''} type="button" onClick={() => onTabChange('roles')}>
            {t('admin.roles')}
          </button>
        )}
        {adminAccess.users && (
          <button className={tab === 'users' ? 'active' : ''} type="button" onClick={() => onTabChange('users')}>
            {t('admin.users')}
          </button>
        )}
        {adminAccess.settings && (
          <button className={tab === 'settings' ? 'active' : ''} type="button" onClick={() => onTabChange('settings')}>
            {t('admin.settings')}
          </button>
        )}
      </div>
      {message && <div className="formMessage">{message}</div>}

      {tab === 'catalog' && (
        <div className="adminGrid">
          <form className="panelForm" onSubmit={submitCategory}>
            <h2>{categoryEditingId ? t('admin.editCategory') : t('admin.createCategory')}</h2>
            <label>
              {t('form.englishName')}
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t('form.urduName')}
              <input
                dir="rtl"
                value={categoryForm.nameUrdu}
                onChange={(event) => setCategoryForm({ ...categoryForm, nameUrdu: event.target.value })}
                required
              />
            </label>
            <label>
              {t('admin.description')}
              <textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
              />
            </label>
            <label>
              {t('admin.imageUrl')}
              <input
                value={categoryForm.imageUrl}
                onChange={(event) => setCategoryForm({ ...categoryForm, imageUrl: event.target.value })}
              />
            </label>
            <label>
              {t('admin.status')}
              <select
                value={categoryForm.status}
                onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value })}
              >
                <option value="ACTIVE">{t('admin.active')}</option>
                <option value="INACTIVE">{t('admin.inactive')}</option>
              </select>
            </label>
            <button className="primaryButton" type="submit">
              <Save size={18} />
              <span>{categoryEditingId ? t('admin.update') : t('admin.create')}</span>
            </button>
          </form>

          <form className="panelForm wide" onSubmit={submitProduct}>
            <h2>{productEditingId ? t('admin.editProduct') : t('admin.createProduct')}</h2>
            <div className="twoColumns">
              <label>
                {t('admin.category')}
                <select
                  value={productForm.categoryId || categories[0]?.id || ''}
                  onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                  required
                >
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {getLocalizedName(category, language)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('admin.sku')}
                <input
                  value={productForm.sku}
                  onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              {t('form.englishName')}
              <input
                value={productForm.name}
                onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t('form.urduName')}
              <input
                dir="rtl"
                value={productForm.nameUrdu}
                onChange={(event) => setProductForm({ ...productForm, nameUrdu: event.target.value })}
                required
              />
            </label>
            <label>
              {t('form.description')}
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
              />
            </label>
            <label>
              {t('form.urduDescription')}
              <textarea
                dir="rtl"
                value={productForm.descriptionUrdu}
                onChange={(event) => setProductForm({ ...productForm, descriptionUrdu: event.target.value })}
              />
            </label>
            <div className="mediaEditor">
              <div className="inlineHeader">
                <h3>{t('admin.productMedia')}</h3>
                <span className="mediaRuleText">{t('admin.productMediaRules')}</span>
              </div>
              <div className="twoColumns">
                <label className="mediaPicker">
                  <ImagePlus size={20} />
                  <span>{t('admin.productImages')}</span>
                  <input
                    key={`images-${productMediaInputKey}`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      addProductImageFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                </label>
                <label className="mediaPicker">
                  <Video size={20} />
                  <span>{t('admin.productVideo')}</span>
                  <input
                    key={`video-${productMediaInputKey}`}
                    type="file"
                    accept="video/*"
                    onChange={(event) => {
                      setProductVideoFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
              {(productForm.images.length > 0 || productForm.imageFiles.length > 0) && (
                <div className="mediaPreviewGrid">
                  {productForm.images.map((image, index) => (
                    <div className="mediaPreview" key={`existing-${image}`}>
                      <img src={image} alt="" />
                      <button
                        className="iconButton danger"
                        type="button"
                        title={t('admin.removeImage')}
                        onClick={() => removeExistingProductImage(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {imageFilePreviews.map((image, index) => (
                    <div className="mediaPreview" key={image}>
                      <img src={image} alt="" />
                      <button
                        className="iconButton danger"
                        type="button"
                        title={t('admin.removeImage')}
                        onClick={() => removeNewProductImage(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {(productForm.videoUrl || videoFilePreview) && (
                <div className="videoPreview">
                  <video src={videoFilePreview || productForm.videoUrl} controls preload="metadata" />
                  <button className="iconButton danger" type="button" title={t('admin.removeVideo')} onClick={removeProductVideo}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="threeColumns">
              <label>
                {t('admin.retailPrice')}
                <input
                  type="number"
                  min="0"
                  value={productForm.retailPrice}
                  onChange={(event) => setProductForm({ ...productForm, retailPrice: event.target.value })}
                  required
                />
              </label>
              <label>
                {t('admin.stock')}
                <input
                  type="number"
                  min="0"
                  value={productForm.stockQuantity}
                  onChange={(event) => setProductForm({ ...productForm, stockQuantity: event.target.value })}
                  required
                />
              </label>
              <label>
                {t('admin.status')}
                <select
                  value={productForm.status}
                  onChange={(event) => setProductForm({ ...productForm, status: event.target.value })}
                >
                  <option value="ACTIVE">{t('admin.active')}</option>
                  <option value="INACTIVE">{t('admin.inactive')}</option>
                </select>
              </label>
            </div>
            <div className="bulkEditor">
              <div className="inlineHeader">
                <h3>{t('admin.bulkPrices')}</h3>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() =>
                    setProductForm({
                      ...productForm,
                      bulkPrices: [...productForm.bulkPrices, { minQuantity: '', unitPrice: '' }],
                    })
                  }
                  title={t('admin.addBulkPrice')}
                >
                  <Plus size={18} />
                </button>
              </div>
              {productForm.bulkPrices.map((rule, index) => (
                <div className="bulkRule" key={`${index}-${rule.minQuantity}`}>
                  <input
                    type="number"
                    min="2"
                    placeholder={t('admin.qty')}
                    value={rule.minQuantity}
                    onChange={(event) => {
                      const next = [...productForm.bulkPrices]
                      next[index] = { ...rule, minQuantity: event.target.value }
                      setProductForm({ ...productForm, bulkPrices: next })
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder={t('admin.unitPrice')}
                    value={rule.unitPrice}
                    onChange={(event) => {
                      const next = [...productForm.bulkPrices]
                      next[index] = { ...rule, unitPrice: event.target.value }
                      setProductForm({ ...productForm, bulkPrices: next })
                    }}
                  />
                  <button
                    className="iconButton danger"
                    type="button"
                    title={t('admin.removeBulkPrice')}
                    onClick={() =>
                      setProductForm({
                        ...productForm,
                        bulkPrices: productForm.bulkPrices.filter((_, ruleIndex) => ruleIndex !== index),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="primaryButton" type="submit">
              <Save size={18} />
              <span>{productEditingId ? t('admin.update') : t('admin.create')}</span>
            </button>
          </form>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="adminLists">
          <AdminList
            title={t('admin.categories')}
            items={categories}
            onEdit={editCategory}
            onActivate={(item) => changeCategoryStatus(item, 'ACTIVE')}
            onDeactivate={(item) => changeCategoryStatus(item, 'INACTIVE')}
            onDelete={deleteCategory}
            language={language}
          />
          <AdminList
            title={t('admin.products')}
            items={products}
            onEdit={editProduct}
            onActivate={(item) => changeProductStatus(item, 'ACTIVE')}
            onDeactivate={(item) => changeProductStatus(item, 'INACTIVE')}
            onDelete={deleteProduct}
            language={language}
          />
        </div>
      )}

      {tab === 'roles' && (
        <div className="adminGrid">
          <form className="panelForm" onSubmit={submitRole}>
            <h2>{roleEditingId ? t('admin.editRole') : t('admin.createRole')}</h2>
            <label>
              {t('form.name')}
              <input
                value={roleForm.name}
                onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              {t('admin.description')}
              <textarea
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
              />
            </label>
            <div className="checkboxGrid">
              {permissions.map((permission) => (
                <label key={permission.code}>
                  <input
                    type="checkbox"
                    checked={roleForm.permissionCodes.includes(permission.code)}
                    onChange={() => toggleRolePermission(permission.code)}
                  />
                  <span>{permission.name}</span>
                </label>
              ))}
            </div>
            <button className="primaryButton" type="submit">
              <Save size={18} />
              <span>{roleEditingId ? t('admin.update') : t('admin.create')}</span>
            </button>
          </form>

          <div className="lineList">
            {roles.map((role) => (
              <article className="roleLine" key={role.id}>
                <div>
                  <h3>{role.name}</h3>
                  <p>{role.permissionCodes.join(', ') || t('admin.noPermissions')}</p>
                </div>
                <button
                  className="iconButton"
                  type="button"
                  title={t('admin.editRole')}
                  onClick={() => {
                    setRoleEditingId(role.id)
                    setRoleForm({
                      name: role.name,
                      description: role.description || '',
                      permissionCodes: role.permissionCodes,
                    })
                  }}
                >
                  <Pencil size={18} />
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="lineList">
          {users.map((user) => (
            <article className="userLine" key={user.id}>
              <div>
                <h3>{user.name}</h3>
                <p>
                  {user.email} - {user.mobile}
                </p>
                <span className={user.status === 'ACTIVE' ? 'statusPill good' : 'statusPill bad'}>
                  {translateStatus(t, user.status)} {user.inactiveReason ? `- ${user.inactiveReason}` : ''}
                </span>
              </div>
              <div className="checkboxGrid compactChecks">
                {roles.map((role) => (
                  <label key={`${user.id}-${role.id}`}>
                    <input
                      type="checkbox"
                      checked={(userRoleSelection[user.id] || []).includes(role.id)}
                      onChange={() => toggleUserRole(user.id, role.id)}
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
              <div className="buttonColumn">
                <button className="secondaryButton" type="button" onClick={() => assignRoles(user.id)}>
                  <Users size={18} />
                  <span>{t('admin.assignRoles')}</span>
                </button>
                {user.status === 'ACTIVE' ? (
                  <button
                    className="secondaryButton dangerText"
                    type="button"
                    onClick={() => updateUserStatus(user, 'INACTIVE')}
                  >
                    <XCircle size={18} />
                    <span>{t('admin.inactive')}</span>
                  </button>
                ) : (
                  <button className="secondaryButton" type="button" onClick={() => updateUserStatus(user, 'ACTIVE')}>
                    <CheckCircle2 size={18} />
                    <span>{t('admin.active')}</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="adminGrid settingsGrid">
          <form className="panelForm" onSubmit={submitSettings}>
            <h2>{t('admin.commerceSettings')}</h2>
            <label>
              {t('admin.taxPercent')}
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settingsForm.taxPercent}
                onChange={(event) => setSettingsForm({ ...settingsForm, taxPercent: event.target.value })}
                required
              />
            </label>
            <label>
              {t('admin.deliveryCharge')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={settingsForm.deliveryCharge}
                onChange={(event) => setSettingsForm({ ...settingsForm, deliveryCharge: event.target.value })}
                required
              />
            </label>
            <label>
              {t('admin.freeDeliveryOver')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={settingsForm.freeDeliveryOver}
                onChange={(event) => setSettingsForm({ ...settingsForm, freeDeliveryOver: event.target.value })}
                required
              />
            </label>
            <button className="primaryButton" type="submit" disabled={settingsSaving}>
              <Save size={18} />
              <span>{t('admin.saveSettings')}</span>
            </button>
          </form>

          <div className="lineList settingsMetrics">
            <article className="settingsMetric">
              <span className="settingsMetricIcon">
                <Percent size={20} />
              </span>
              <div>
                <h3>{t('admin.taxPercent')}</h3>
                <p>{Number(settingsForm.taxPercent || 0).toFixed(2)}%</p>
              </div>
            </article>
            <article className="settingsMetric">
              <span className="settingsMetricIcon">
                <Truck size={20} />
              </span>
              <div>
                <h3>{t('admin.deliveryCharge')}</h3>
                <p>{formatMoney(settingsForm.deliveryCharge, locale)}</p>
              </div>
            </article>
            <article className="settingsMetric">
              <span className="settingsMetricIcon">
                <Settings size={20} />
              </span>
              <div>
                <h3>{t('admin.freeDeliveryOver')}</h3>
                <p>{formatMoney(settingsForm.freeDeliveryOver, locale)}</p>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}

function AdminList({ title, items, onEdit, onActivate, onDeactivate, onDelete, language }) {
  const { t } = useI18n()

  return (
    <section className="lineList">
      <div className="inlineHeader">
        <h2>{title}</h2>
      </div>
      {items.length === 0 && <div className="emptyState">{t('admin.noItems')}</div>}
      {items.map((item) => (
        <article className="adminLine" key={item.id}>
          <div>
            <h3>{item.sku ? getLocalizedProductName(item, language) : getLocalizedName(item, language)}</h3>
            <p>{item.sku || item.description || getLocalizedCategoryName(item, language)}</p>
            <span className={item.status === 'ACTIVE' ? 'statusPill good' : 'statusPill bad'}>
              {translateStatus(t, item.status)}
            </span>
          </div>
          <div className="buttonRow">
            <button className="iconButton" type="button" title={t('admin.edit')} onClick={() => onEdit(item)}>
              <Pencil size={18} />
            </button>
            {item.status === 'ACTIVE' ? (
              <button
                className="iconButton"
                type="button"
                title={t('admin.markInactive')}
                onClick={() => onDeactivate(item)}
              >
                <XCircle size={18} />
              </button>
            ) : (
              <button
                className="iconButton"
                type="button"
                title={t('admin.markActive')}
                onClick={() => onActivate(item)}
              >
                <CheckCircle2 size={18} />
              </button>
            )}
            <button className="iconButton danger" type="button" title={t('admin.delete')} onClick={() => onDelete(item)}>
              <Trash2 size={18} />
            </button>
          </div>
        </article>
      ))}
    </section>
  )
}

export default AdminPanel
