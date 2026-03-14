import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"

import type { Menu, AddOn } from "../../../types"
import { api } from "../../../utils/api"
import { useToast } from "../../../context/ToastContext"
import { useAuth } from "../../../context/AuthContext"
import {
  AdminCheckboxField,
  AdminInputField,
  AdminSection,
  AdminTextareaField,
  ADMIN_INPUT_CLASS,
} from "./shared/AdminFormControls"

const MENU_ENDPOINT = "/api/v1/menu"

type ImageType = "front" | "top" | "back" | "angled"

const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return "Unexpected error occurred"
}

const defaultForm: Menu = {
  restaurantId: "",
  branchId: "",
  name: "",
  description: "",
  price: 0,
  category: "",
  addOns: [],
  images: {
    front: null,
    top: null,
    back: null,
    angled: null,
  },
  isVeg: true,
  isSpicy: false,
  has3DModel: false,
  isAvailable: true,
  preparationTimeMinutes: 10,
  rating: { average: 0, count: 0 },
}

export default function MenuFormPage() {

  const { id } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { user } = useAuth()

  const isEditMode = Boolean(id && id !== "new")

  const [form, setForm] = useState<Menu>({
    ...defaultForm,
    restaurantId: user?.restroId ?? "",
    branchId: user?.branchId ?? "",
  })

  const [loading, setLoading] = useState(false)

  const [, setErrors] = useState<Record<string, string>>({})

  const [previews, setPreviews] = useState<Record<ImageType, string>>({
    front: "",
    top: "",
    back: "",
    angled: "",
  })

  /* --------------------------- LOAD DATA --------------------------- */

  useEffect(() => {

    if (!isEditMode || !id) return

    const load = async () => {

      setLoading(true)

      try {

        const data = await api.get<any>(`${MENU_ENDPOINT}/${id}`)

        const payload = data?.data ?? data

        setForm({
          ...defaultForm,
          ...payload,
          restaurantId: payload?.restaurantId ?? user?.restroId ?? "",
          branchId: payload?.branchId ?? user?.branchId ?? "",
          addOns: payload?.addOns ?? [],
          rating: payload?.rating ?? { average: 0, count: 0 },
        })

      } catch (error) {

        console.error("Load Menu Error:", error)

        pushToast({
          title: "Unable to load menu item",
          description: getErrorMessage(error),
          variant: "error"
        })

      } finally {
        setLoading(false)
      }
    }

    load()

  }, [id, isEditMode, user])

  /* --------------------------- VALIDATION --------------------------- */

  const validate = () => {

    const next: Record<string, string> = {}

    if (!form.name.trim()) next.name = "Name required"
    if (!form.category.trim()) next.category = "Category required"
    if (form.price <= 0) next.price = "Invalid price"
    if (form.preparationTimeMinutes <= 0)
      next.preparationTimeMinutes = "Invalid time"

    setErrors(next)

    return Object.keys(next).length === 0
  }

  /* --------------------------- IMAGE HANDLING --------------------------- */

  const uploadImage = (file: File, type: ImageType) => {

    const preview = URL.createObjectURL(file)

    setForm(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: file
      }
    }))

    setPreviews(prev => ({
      ...prev,
      [type]: preview
    }))
  }

  const removeImage = (type: ImageType) => {

    setForm(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: null
      }
    }))

    setPreviews(prev => ({
      ...prev,
      [type]: ""
    }))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: ImageType) => {

    e.preventDefault()

    const file = e.dataTransfer.files?.[0]

    if (file) uploadImage(file, type)
  }

  /* --------------------------- ADDONS --------------------------- */

  const addAddon = () => {

    const addon: AddOn = {
      name: "",
      price: 0,
      isAvailable: true
    }

    setForm(prev => ({
      ...prev,
      addOns: [...prev.addOns, addon]
    }))
  }

  const removeAddon = (index: number) => {

    setForm(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index)
    }))
  }

  const updateAddon = (
    index: number,
    field: keyof AddOn,
    value: any
  ) => {

    const updated = [...form.addOns]

    updated[index] = {
      ...updated[index],
      [field]: value
    }

    setForm(prev => ({
      ...prev,
      addOns: updated
    }))
  }

  /* --------------------------- SUBMIT --------------------------- */

  const handleSubmit = async () => {

    if (!validate()) return

    setLoading(true)

    try {

      const payload = {
        ...form,
        price: Number(form.price),
        preparationTimeMinutes: Number(form.preparationTimeMinutes),
      }

      if (isEditMode && id) {

        await api.put(`${MENU_ENDPOINT}/${id}`, payload)

        pushToast({ title: "Menu updated", variant: "success" })

      } else {

        await api.post(MENU_ENDPOINT, payload)

        pushToast({ title: "Menu created", variant: "success" })
      }

      navigate("/admin/menu")

    } catch (error) {

      console.error("Save Menu Error:", error)

      pushToast({
        title: "Save failed",
        description: getErrorMessage(error),
        variant: "error"
      })

    } finally {
      setLoading(false)
    }
  }

  /* --------------------------- UI --------------------------- */

  const imageTypes: ImageType[] = ["front", "top", "back", "angled"]

  return (

    <div className="min-h-screen bg-[#fff9f2] space-y-8">

      <h1 className="text-3xl font-bold text-[#3b2f2f]">
        {isEditMode ? "Edit Menu Item" : "Create Menu Item"}
      </h1>

      {/* BASIC INFO */}

      <AdminSection className="shadow space-y-4">

        <AdminInputField
          id="name"
          label="Name"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <AdminTextareaField
          id="Description"
          label="Description"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <AdminInputField
          id="Price"
          label="Price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={e => setForm({ ...form, price: Number(e.target.value) })}
        />

        <AdminInputField
          id="Preparation_Time"
          label="Preparation Time"
          type="number"
          placeholder="Preparation Time"
          value={form.preparationTimeMinutes}
          onChange={e =>
            setForm({ ...form, preparationTimeMinutes: Number(e.target.value) })
          }
        />

        <AdminInputField
          id="Category"
          label="Category"
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        />

      </AdminSection>

      {/* IMAGE UPLOAD */}

      <AdminSection className="shadow">

        <h2 className="font-semibold mb-4">Menu Images</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {imageTypes.map(type => {

            const preview = previews[type]

            return (

              <div
                key={type}
                onDrop={e => handleDrop(e, type)}
                onDragOver={e => e.preventDefault()}
                className="relative h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-orange-400 cursor-pointer overflow-hidden"
              >

                {preview ? (

                  <>
                    <img
                      src={preview}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(type)}
                      className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </>

                ) : (

                  <label className="flex flex-col items-center justify-center w-full h-full">

                    <span className="text-sm capitalize">{type} image</span>

                    <span className="text-xs text-gray-400">
                      Drag or click
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) uploadImage(file, type)
                      }}
                    />

                  </label>

                )}

              </div>

            )

          })}

        </div>

      </AdminSection>

      {/* FLAGS */}

      <AdminSection className="shadow grid grid-cols-2 md:grid-cols-4 gap-4">

        <AdminCheckboxField
          label="Veg"
          checked={form.isVeg}
          onChange={e => setForm({ ...form, isVeg: e.target.checked })}
        />

        <AdminCheckboxField
          label="Spicy"
          checked={form.isSpicy}
          onChange={e => setForm({ ...form, isSpicy: e.target.checked })}
        />

        <AdminCheckboxField
          label="Available"
          checked={form.isAvailable}
          onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
        />

      </AdminSection>

      {/* ADDONS */}

      <AdminSection className="shadow space-y-4">

        <div className="flex justify-between">

          <h2 className="font-semibold">Add Ons</h2>

          <button
            type="button"
            onClick={addAddon}
            className="flex items-center gap-2 text-orange-500"
          >
            <Plus size={16} /> Add
          </button>

        </div>

        {form.addOns.map((addon, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
          >

            <input
              value={addon.name}
              placeholder="Addon name"
              onChange={e => updateAddon(index, "name", e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />

            <input
              type="number"
              value={addon.price}
              placeholder="Price"
              onChange={e => updateAddon(index, "price", Number(e.target.value))}
              className={ADMIN_INPUT_CLASS}
            />

            <AdminCheckboxField
              label="Available"
              checked={addon.isAvailable}
              onChange={e => updateAddon(index, "isAvailable", e.target.checked)}
            />

            <button
              type="button"
              onClick={() => removeAddon(index)}
              className="text-red-500"
            >
              <Trash2 size={16} />
            </button>

          </div>
        ))}

      </AdminSection>

      {/* ACTIONS */}

      <div className="flex justify-end gap-4">

        <button
          onClick={() => navigate("/admin/menu")}
          className="px-6 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="px-6 py-2 bg-linear-to-tr from-yellow-400 to-orange-500 text-white rounded-lg"
        >
          {loading ? "Saving..." : "Save"}
        </button>

      </div>

    </div>

  )
}
