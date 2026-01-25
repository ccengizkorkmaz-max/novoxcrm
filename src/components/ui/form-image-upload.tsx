'use client'

import { useState } from 'react'
import { ImageUpload } from './image-upload'

interface FormImageUploadProps {
    name: string
    defaultValue?: string
}

export function FormImageUpload({ name, defaultValue }: FormImageUploadProps) {
    const [url, setUrl] = useState(defaultValue || '')

    return (
        <>
            <input type="hidden" name={name} value={url} />
            <ImageUpload value={url} onChange={setUrl} />
        </>
    )
}
