import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CheckIcon, ChevronDownIcon, Plus, Trash2 } from "lucide-react"

import { menuCategoryNames, type Menu, type AddOn } from "../../../types"
import { api } from "../../../utils/api"
import { getApiErrorMessage, getApiFieldErrors } from "../../../utils/apiErrorHelpers"
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
type MenuFormState = Omit<Menu, "images"> & {
  images: Record<ImageType, File | null>
}
type MenuImageRecord = {
  url?: string
  s3Key?: string
  mimeType?: string
  sizeBytes?: number
  altText?: string
  isPrimary?: boolean
  displayOrder?: number
}
type MenuVideoRecord = {
  url?: string
  s3Key?: string
  mimeType?: string
  sizeBytes?: number
}
type MenuImageSlots = Record<ImageType, MenuImageRecord | null>
type BranchReference =
  | string
  | {
    _id?: string
    id?: string
    name?: string
  }
type BranchSource = BranchReference | BranchReference[] | null | undefined
type BranchOption = { _id: string; name: string }
type UploadTarget = {
  uploadUrl?: string
  key?: string
}
type MenuSaveResponse = {
  success?: boolean
  warning?: string
}
type MenuResponse = Partial<Omit<MenuFormState, "images">> & {
  _id?: string
  branchId?: BranchSource
  branchIds?: BranchSource
  images?: MenuImageRecord[]
  video?: MenuVideoRecord | null
  rating?: {
    average?: number
    count?: number
  }
}

const imageTypes: ImageType[] = ["front", "top", "back", "angled"]
const defaultPreviews: Record<ImageType, string> = {
  front: "",
  top: "",
  back: "",
  angled: "",
}
const defaultPersistedImages: MenuImageSlots = {
  front: null,
  top: null,
  back: null,
  angled: null,
}

const toBranchArray = (value: BranchSource): BranchReference[] => {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

const getBranchId = (branch: BranchReference): string => {
  if (typeof branch === "string") return branch
  return branch._id ?? branch.id ?? ""
}

const normalizeBranchIds = (value: BranchSource): string[] =>
  Array.from(
    new Set(
      toBranchArray(value)
        .map(getBranchId)
        .filter(Boolean),
    ),
  )

const normalizeBranchOptions = (value: BranchSource): BranchOption[] =>
  toBranchArray(value).flatMap((branch) => {
    if (typeof branch === "string") return []

    const branchId = getBranchId(branch)
    if (!branchId) return []

    return [
      {
        _id: branchId,
        name: branch.name?.trim() || "Unnamed Branch",
      },
    ]
  })

const mergeBranchOptions = (...lists: BranchOption[][]): BranchOption[] => {
  const branchMap = new Map<string, BranchOption>()

  lists.flat().forEach((branch) => {
    const existing = branchMap.get(branch._id)

    if (!existing || existing.name === "Unnamed Branch") {
      branchMap.set(branch._id, branch)
    }
  })

  return Array.from(branchMap.values())
}

const revokePreviewUrl = (url: string) => {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url) // delete the blob url creatd by browser
  }
}

const normalizeImagePreviews = (
  images: MenuImageRecord[] | undefined,
): Record<ImageType, string> => {
  const next = { ...defaultPreviews }

  if (!Array.isArray(images)) {
    return next
  }

  const sortedImages = [...images].sort(
    (left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
  )

  sortedImages.slice(0, imageTypes.length).forEach((image, index) => {
    if (image?.url) {
      next[imageTypes[index]] = image.url
    }
  })

  return next
}

const normalizePersistedImages = (
  images: MenuImageRecord[] | undefined,
): MenuImageSlots => {
  const next = { ...defaultPersistedImages }

  if (!Array.isArray(images)) {
    return next
  }

  const sortedImages = [...images].sort(
    (left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
  )

  sortedImages.slice(0, imageTypes.length).forEach((image, index) => {
    next[imageTypes[index]] = image
  })

  return next
}

const isAbsoluteHttpUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://")

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
    reader.readAsDataURL(file)
  })

const defaultForm: MenuFormState = {
  restaurantId: "",
  branchIds: [],
  name: "",
  description: "",
  price: 0,
  category: "",
  addOns: [],
  image:"",
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
  const { user } = useAuth()
  const [branches, setBranches] = useState<BranchOption[]>(() =>
    normalizeBranchOptions(user?.branchIds),
  )
  const { id } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()

  const isEditMode = Boolean(id && id !== "new")

  const [form, setForm] = useState<MenuFormState>(() => ({
    ...defaultForm,
    restaurantId: user?.restroId ?? "",
    branchIds: normalizeBranchIds(user?.branchIds),
  }))

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [previews, setPreviews] = useState<Record<ImageType, string>>(defaultPreviews)
  const [persistedImages, setPersistedImages] = useState<MenuImageSlots>(defaultPersistedImages)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [persistedVideo, setPersistedVideo] = useState<MenuVideoRecord | null>(null)
  const [videoError, setVideoError] = useState<string>("")

  const categories = menuCategoryNames

  const clearError = (field: string) => {
    setErrors(current => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  /* --------------------------- LOAD DATA --------------------------- */
  useEffect(() => {
    const userBranches = normalizeBranchOptions(user?.branchIds)
    if (userBranches.length) {
      setBranches(current => mergeBranchOptions(current, userBranches))
    }

    if (isEditMode) return

    const nextBranchIds = normalizeBranchIds(user?.branchIds)

    setForm(current => {
      const nextRestaurantId = current.restaurantId || user?.restroId || ""
      const branchIdsChanged =
        current.branchIds.length === 0 && nextBranchIds.length > 0

      if (!branchIdsChanged && current.restaurantId === nextRestaurantId) {
        return current
      }

      return {
        ...current,
        restaurantId: nextRestaurantId,
        branchIds: branchIdsChanged ? nextBranchIds : current.branchIds,
      }
    })
  }, [isEditMode, user?.branchIds, user?.restroId])

  useEffect(() => {
    if (!isEditMode || !id) return

    const load = async () => {
      setLoading(true)
      try {
        const data = await api.get<{ data?: MenuResponse } & MenuResponse>(`${MENU_ENDPOINT}/${id}`)
        const payload = (data?.data ?? data) as MenuResponse
        const nextBranchIds = normalizeBranchIds(
          payload?.branchIds ?? payload?.branchId ?? user?.branchIds,
        )
        const nextPreviews = normalizeImagePreviews(payload?.images)
        const nextPersistedImages = normalizePersistedImages(payload?.images)

        setBranches(current =>
          mergeBranchOptions(
            current,
            normalizeBranchOptions(user?.branchIds),
            normalizeBranchOptions(payload?.branchIds ?? payload?.branchId),
          ),
        )

        setForm({
          ...defaultForm,
          restaurantId: payload?.restaurantId ?? user?.restroId ?? "",
          branchIds: nextBranchIds,
          name: payload?.name ?? "",
          description: payload?.description ?? "",
          price: Number(payload?.price ?? 0),
          category: payload?.category ?? "",
          addOns: payload?.addOns ?? [],
          isVeg: payload?.isVeg ?? true,
          isSpicy: payload?.isSpicy ?? false,
          has3DModel: payload?.has3DModel ?? false,
          isAvailable: payload?.isAvailable ?? true,
          preparationTimeMinutes: Number(payload?.preparationTimeMinutes ?? 10),
          rating: payload?.rating ?? { average: 0, count: 0 },
        })
        setPreviews(nextPreviews)
        setPersistedImages(nextPersistedImages)

        if (payload?.video?.url) {
          setVideoPreview(payload.video.url)
          setPersistedVideo(payload.video)
        } else {
          setVideoPreview("")
          setPersistedVideo(null)
        }
      } catch (error) {
        pushToast({
          title: "Unable to load menu item",
          description: getApiErrorMessage(error, "Unable to load menu item."),
          variant: "error"
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEditMode, pushToast, user])

  useEffect(() => () => {
    Object.values(previews).forEach(revokePreviewUrl)
  }, [previews])

  useEffect(() => () => {
    revokePreviewUrl(videoPreview)
  }, [videoPreview])

  /* --------------------------- VALIDATION --------------------------- */

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.restaurantId.trim()) next.restaurantId = "Restaurant is required."
    if (!form.branchIds.length) next.branchIds = "Select at least one branch."
    if (!form.name.trim()) next.name = "Menu item name is required."
    if (!form.category.trim()) next.category = "Category is required."
    if (form.price <= 0) next.price = "Price must be greater than 0."
    if (form.preparationTimeMinutes <= 0) {
      next.preparationTimeMinutes = "Preparation time must be greater than 0."
    }

    setErrors(next)
    setSubmitError("")
    return Object.keys(next).length === 0
  }

  /* --------------------------- IMAGE HANDLING --------------------------- */

  const buildAltText = (type: ImageType) => `${form.name.trim() || "Menu"} ${type}`

  const uploadMenuImage = async (file: File, type: ImageType, displayOrder: number): Promise<MenuImageRecord> => {
    const branchId = form.branchIds[0]
    if (!form.restaurantId.trim() || !branchId) {
      throw new Error("Restaurant and branch are required before uploading images")
    }

    const contentType = file.type || "application/octet-stream"
    const response = await api.post<{ data?: UploadTarget } & UploadTarget>(
      `${MENU_ENDPOINT}/uploads/presign`,
      {
        restaurantId: form.restaurantId,
        branchId,
        fileName: file.name,
        contentType,
      },
    )
    const uploadTarget = response?.data ?? response
    const uploadUrl = uploadTarget?.uploadUrl ?? ""
    const key = uploadTarget?.key ?? ""

    if (!uploadUrl || !key) {
      throw new Error("Unable to prepare menu image upload")
    }

    if (!isAbsoluteHttpUrl(uploadUrl)) {
      return {
        url: await fileToDataUrl(file),
        mimeType: contentType,
        sizeBytes: file.size,
        altText: buildAltText(type),
        isPrimary: displayOrder === 0,
        displayOrder,
      }
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Unable to upload ${file.name}`)
    }

    return {
      s3Key: key,
      mimeType: contentType,
      sizeBytes: file.size,
      altText: buildAltText(type),
      isPrimary: displayOrder === 0,
      displayOrder,
    }
  }

  const buildImagesPayload = async (): Promise<MenuImageRecord[]> => {
    const nextImages: MenuImageRecord[] = []

    for (const [displayOrder, type] of imageTypes.entries()) {
      const file = form.images[type]

      if (file) {
        nextImages.push(await uploadMenuImage(file, type, displayOrder))
        continue
      }

      const image = persistedImages[type]
      if (!image?.s3Key?.trim() && !image?.url?.trim()) {
        continue
      }

      nextImages.push({
        ...(image.s3Key?.trim() ? { s3Key: image.s3Key.trim() } : {}),
        ...(image.url?.trim() ? { url: image.url.trim() } : {}),
        mimeType: image.mimeType?.trim(),
        sizeBytes: image.sizeBytes,
        altText: image.altText?.trim() || buildAltText(type),
        isPrimary: displayOrder === 0,
        displayOrder,
      })
    }

    return nextImages
  }

  const uploadImage = (file: File, type: ImageType) => {
    if (!file.type.startsWith("image/")) {
      pushToast({
        title: "Invalid image",
        description: "Please choose an image file.",
        variant: "error",
      })
      return
    }

    const preview = URL.createObjectURL(file)
    revokePreviewUrl(previews[type])
    clearError("images")
    setSubmitError("")
    setPersistedImages(prev => ({ ...prev, [type]: null }))
    setForm(prev => ({
      ...prev,
      images: { ...prev.images, [type]: file }
    }))
    setPreviews(prev => ({ ...prev, [type]: preview }))
  }

  const removeImage = (type: ImageType) => {
    revokePreviewUrl(previews[type])
    clearError("images")
    setPersistedImages(prev => ({ ...prev, [type]: null }))
    setForm(prev => ({
      ...prev,
      images: { ...prev.images, [type]: null }
    }))
    setPreviews(prev => ({ ...prev, [type]: "" }))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: ImageType) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadImage(file, type)
  }

  /* --------------------------- VIDEO HANDLING --------------------------- */

  const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
  const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"])

  const validateVideoFile = (file: File): Promise<string | null> =>
    new Promise((resolve) => {
      if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
        resolve("Only MP4 and WebM videos are allowed.")
        return
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        resolve(`Video must be smaller than 10 MB (yours is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
        return
      }
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        if (video.duration > 15) {
          resolve(`Video duration (${Math.ceil(video.duration)}s) exceeds the 15-second limit.`)
        } else {
          resolve(null)
        }
      }
      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        resolve("Unable to read video file. Please try a different file.")
      }
      video.src = URL.createObjectURL(file)
    })

  const uploadMenuVideo = async (file: File): Promise<MenuVideoRecord> => {
    const branchId = form.branchIds[0]
    if (!form.restaurantId.trim() || !branchId) {
      throw new Error("Restaurant and branch are required before uploading video")
    }
    const contentType = file.type || "video/mp4"
    const response = await api.post<{ data?: UploadTarget } & UploadTarget>(
      `${MENU_ENDPOINT}/uploads/presign`,
      {
        restaurantId: form.restaurantId,
        branchId,
        fileName: file.name,
        contentType,
      },
    )
    const uploadTarget = response?.data ?? response
    const uploadUrl = uploadTarget?.uploadUrl ?? ""
    const key = uploadTarget?.key ?? ""

    if (!uploadUrl || !key) {
      throw new Error("Unable to prepare video upload")
    }

    if (!isAbsoluteHttpUrl(uploadUrl)) {
      return {
        url: URL.createObjectURL(file),
        mimeType: contentType,
        sizeBytes: file.size,
      }
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Unable to upload ${file.name}`)
    }

    return {
      s3Key: key,
      mimeType: contentType,
      sizeBytes: file.size,
    }
  }

  const handleVideoSelect = async (file: File) => {
    setVideoError("")
    const error = await validateVideoFile(file)
    if (error) {
      setVideoError(error)
      return
    }
    revokePreviewUrl(videoPreview)
    const preview = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoPreview(preview)
    setPersistedVideo(null)
  }

  const removeVideo = () => {
    revokePreviewUrl(videoPreview)
    setVideoFile(null)
    setVideoPreview("")
    setPersistedVideo(null)
    setVideoError("")
  }

  const buildVideoPayload = async (): Promise<MenuVideoRecord | null> => {
    if (videoFile) {
      return uploadMenuVideo(videoFile)
    }
    if (persistedVideo?.s3Key?.trim() || persistedVideo?.url?.trim()) {
      return {
        ...(persistedVideo.s3Key?.trim() ? { s3Key: persistedVideo.s3Key.trim() } : {}),
        ...(persistedVideo.url?.trim() ? { url: persistedVideo.url.trim() } : {}),
        mimeType: persistedVideo.mimeType?.trim(),
        sizeBytes: persistedVideo.sizeBytes,
      }
    }
    return null
  }

  /* --------------------------- ADDONS --------------------------- */

  const addAddon = () => {
    const addon: AddOn = { name: "", price: 0, isAvailable: true }
    setForm(prev => ({ ...prev, addOns: [...prev.addOns, addon] }))
  }

  const removeAddon = (index: number) => {
    setForm(prev => ({ ...prev, addOns: prev.addOns.filter((_, i) => i !== index) }))
  }

  const updateAddon = (index: number, field: keyof AddOn, value: AddOn[keyof AddOn]) => {
    const updated = [...form.addOns]
    updated[index] = { ...updated[index], [field]: value }
    setForm(prev => ({ ...prev, addOns: updated }))
  }

  /* --------------------------- SUBMIT --------------------------- */

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setSubmitError("")
    try {
      const images = await buildImagesPayload()
      const video = await buildVideoPayload()
      const payload = {
        restaurantId: form.restaurantId,
        branchIds: form.branchIds,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        price: Number(form.price ?? 0),
        preparationTimeMinutes: Number(form.preparationTimeMinutes ?? 0),
        category: form.category.trim(),
        addOns: form.addOns
          .filter(addon => addon.name.trim())
          .map(addon => ({
            name: addon.name.trim(),
            price: Number(addon.price ?? 0),
            isAvailable: addon.isAvailable ?? true,
          })),
        images,
        video,
        isVeg: form.isVeg ?? true,
        isSpicy: form.isSpicy ?? false,
        has3DModel: form.has3DModel ?? false,
        isAvailable: form.isAvailable ?? true,
        rating: form.rating ?? { average: 0, count: 0 },
      }
      let response: MenuSaveResponse | undefined
      if (isEditMode && id) {
        response = await api.patch<MenuSaveResponse>(`${MENU_ENDPOINT}/${id}`, payload)
      } else {
        response = await api.post<MenuSaveResponse>(MENU_ENDPOINT, payload)
      }

      pushToast({
        title: isEditMode ? "Menu updated successfully" : "Menu created successfully",
        variant: "success",
      })
      if (response?.warning) {
        pushToast({
          title: "Storage cleanup warning",
          description: response.warning,
          variant: "warning",
        })
      }
      navigate("/admin/menu")
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to save this menu item.")
      const fieldErrors = getApiFieldErrors(error)
      if (Object.keys(fieldErrors).length) {
        setErrors(current => ({
          ...current,
          ...fieldErrors,
        }))
      }
      setSubmitError(message)
      pushToast({ title: "Save failed", description: message, variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  /* --------------------------- UI --------------------------- */

  const selectedBranchLabel = form.branchIds.length
    ? form.branchIds
      .map(branchId => branches.find(branch => branch._id === branchId)?.name ?? branchId)
      .join(", ")
    : "Select Branch"
  const categoryLabel = form.category || "Select Category"

  return (
    <div className="min-h-screen bg-[#fff9f2]  space-y-10">

      <h1 className="text-3xl font-bold text-[#3b2f2f]">
        {isEditMode ? "Edit Menu Item" : "Create Menu Item"}
      </h1>

      {submitError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      {/* BASIC INFO */}
      <AdminSection className="shadow space-y-6 p-6 rounded-2xl">

        {/* Branch Selection */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Branches</label>

          <Listbox
            value={form.branchIds}
            onChange={(vals: string[]) => {
              clearError("branchIds")
              setSubmitError("")
              setForm(prev => ({ ...prev, branchIds: vals }))
            }}
            multiple
          >
            <div className="relative">
              <ListboxButton className="cursor-pointer w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 text-left focus:outline-none flex items-center justify-between">
                <span className="truncate">{selectedBranchLabel}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </ListboxButton>

              <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                {branches.length ? (
                  branches.map(branch => (
                    <ListboxOption
                      key={branch._id}
                      value={branch._id}
                      className={({ focus }) =>
                        `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${focus ? "bg-orange-100 text-orange-700" : "text-gray-700"}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>{branch.name}</span>
                          {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                        </>
                      )}
                    </ListboxOption>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No branches available
                  </div>
                )}
              </ListboxOptions>
            </div>
          </Listbox>
          {errors.branchIds || errors.restaurantId ? (
            <p className="text-sm text-red-600">
              {errors.branchIds ?? errors.restaurantId}
            </p>
          ) : null}
        </div>

        {/* Name, Price, Time, Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInputField
            id="name"
            label="Name"
            placeholder="Name"
            value={form.name}
            error={errors.name}
            onChange={e => {
              clearError("name")
              setSubmitError("")
              setForm({ ...form, name: e.target.value })
            }}
          />

          <AdminInputField
            id="Price"
            label="Price"
            type="number"
            placeholder="Price"
            value={form.price}
            error={errors.price}
            onChange={e => {
              clearError("price")
              setSubmitError("")
              setForm({ ...form, price: Number(e.target.value) })
            }}
          />

          <AdminInputField
            id="Preparation_Time"
            label="Preparation Time"
            type="number"
            placeholder="Preparation Time"
            value={form.preparationTimeMinutes}
            error={errors.preparationTimeMinutes}
            onChange={e =>
              {
                clearError("preparationTimeMinutes")
                setSubmitError("")
                setForm({ ...form, preparationTimeMinutes: Number(e.target.value) })
              }
            }
          />

          {/* CATEGORY */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Category</label>

            <Listbox
              value={form.category}
              onChange={(val) => {
                clearError("category")
                setSubmitError("")
                setForm(prev => ({ ...prev, category: val }))
              }}
            >
              <div className="relative">
                <ListboxButton className="cursor-pointer w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3 text-left focus:outline-none flex items-center justify-between">
                  <span>{categoryLabel}</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </ListboxButton>

                <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
                  {categories.map(item => (
                    <ListboxOption
                      key={item}
                      value={item}
                      className={({ focus }) =>
                        `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${focus ? "bg-orange-100 text-orange-700" : "text-gray-700"}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>{item}</span>
                          {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
            {errors.category ? (
              <p className="text-sm text-red-600">{errors.category}</p>
            ) : null}
          </div>
        </div>

        <AdminTextareaField
          id="Description"
          label="Description"
          placeholder="Description"
          value={form.description}
          error={errors.description}
          onChange={e => {
            clearError("description")
            setSubmitError("")
            setForm({ ...form, description: e.target.value })
          }}
        />

      </AdminSection>

      {/* IMAGE UPLOAD */}
      <AdminSection className="shadow p-6 rounded-2xl space-y-4">
        <h2 className="font-semibold">Menu Images</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
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
                    <img src={preview} className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(type)}
                      className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-center px-2">
                    <span className="text-sm capitalize">{type} image</span>
                    <span className="text-xs text-gray-400">Drag or click</span>
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

      {/* VIDEO UPLOAD */}
      <AdminSection className="shadow p-6 rounded-2xl space-y-4">
        <h2 className="font-semibold">
          Menu Video{" "}
          <span className="text-xs font-normal text-gray-400">
            (optional · max 15s · MP4 or WebM · max 10 MB)
          </span>
        </h2>

        {videoPreview ? (
          <div className="relative rounded-xl overflow-hidden bg-black max-w-lg">
            <video
              src={videoPreview}
              controls
              controlsList="nodownload"
              playsInline
              className="w-full aspect-video object-contain"
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition cursor-pointer"
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) handleVideoSelect(file)
            }}
            onDragOver={(e) => e.preventDefault()}
            className="cursor-pointer flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 transition"
          >
            <svg
              className="w-8 h-8 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-500">Click or drag to upload video</span>
            <span className="text-xs text-gray-400 mt-1">
              MP4 or WebM · up to 15 seconds · max 10 MB
            </span>
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleVideoSelect(file)
              }}
            />
          </label>
        )}

        {videoError && (
          <p className="text-sm text-red-600">{videoError}</p>
        )}
      </AdminSection>

      {/* FLAGS */}
      <AdminSection className="shadow p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6">
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
      <AdminSection className="shadow p-6 rounded-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Add Ons</h2>
          <button
            type="button"
            onClick={addAddon}
            className="cursor-pointer flex items-center gap-2 text-orange-500"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="space-y-4">
          {form.addOns.map((addon, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
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
                className="cursor-pointer text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </AdminSection>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={() => navigate("/admin/menu")}
          className="cursor-pointer px-6 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="cursor-pointer px-6 py-2 bg-linear-to-tr from-yellow-400 to-orange-500 text-white rounded-lg"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

    </div>
  )
}
