'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getCourses() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('training_courses')
        .select('*, training_lessons(id), profiles!created_by(full_name)')
        .eq('is_published', true)
        .order('order_index')
    return data || []
}

export async function getAllCourses() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('training_courses')
        .select('*, training_lessons(id, title, order_index), profiles!created_by(full_name)')
        .order('order_index')
    return data || []
}

export async function getCourseWithLessons(courseId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('training_courses')
        .select('*, training_lessons(*, training_quiz_questions(id, question, options, correct_answer, explanation, order_index))')
        .eq('id', courseId)
        .single()
    return data
}

export async function getUserProgress(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', userId)
    return data || []
}

export async function getUserCertificates(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('training_certificates')
        .select('*, training_courses(title)')
        .eq('user_id', userId)
    return data || []
}

export async function createCourse(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    if (!['admin', 'owner'].includes(profile?.role || '')) throw new Error('Yetkiniz yok')

    const { error } = await supabase.from('training_courses').insert({
        tenant_id: profile?.tenant_id,
        title: (formData.get('title') as string)?.trim(),
        description: (formData.get('description') as string)?.trim() || null,
        category: formData.get('category') as string || 'general',
        difficulty: formData.get('difficulty') as string || 'beginner',
        content_type: formData.get('content_type') as string || 'video',
        content_url: (formData.get('content_url') as string)?.trim() || null,
        content_body: (formData.get('content_body') as string)?.trim() || null,
        duration_minutes: Number(formData.get('duration_minutes') || 0),
        is_mandatory: formData.get('is_mandatory') === 'true',
        is_published: formData.get('is_published') === 'true',
        passing_score: Number(formData.get('passing_score') || 70),
        created_by: user.id,
    })

    if (error) throw new Error('Kurs oluşturulamadı: ' + error.message)
    revalidatePath('/training')
    return { success: true }
}

export async function addLesson(courseId: string, formData: FormData) {
    const supabase = await createClient()

    const { count } = await supabase.from('training_lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId)

    const { error } = await supabase.from('training_lessons').insert({
        course_id: courseId,
        title: (formData.get('title') as string)?.trim(),
        description: (formData.get('description') as string)?.trim() || null,
        content_type: formData.get('content_type') as string || 'video',
        content_url: (formData.get('content_url') as string)?.trim() || null,
        content_body: (formData.get('content_body') as string)?.trim() || null,
        duration_minutes: Number(formData.get('duration_minutes') || 0),
        order_index: (count || 0) + 1,
    })

    if (error) throw new Error('Ders eklenemedi: ' + error.message)
    revalidatePath('/training')
    return { success: true }
}

export async function markLessonComplete(courseId: string, lessonId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: existing } = await supabase.from('training_progress')
        .select('id').eq('user_id', user.id).eq('course_id', courseId).eq('lesson_id', lessonId).single()

    if (existing) {
        await supabase.from('training_progress').update({
            status: 'completed', completed_at: new Date().toISOString()
        }).eq('id', existing.id)
    } else {
        await supabase.from('training_progress').insert({
            user_id: user.id, course_id: courseId, lesson_id: lessonId,
            status: 'completed', completed_at: new Date().toISOString()
        })
    }

    // Check if all lessons completed → issue certificate
    const { data: allLessons } = await supabase.from('training_lessons').select('id').eq('course_id', courseId)
    const { data: completedLessons } = await supabase.from('training_progress')
        .select('lesson_id').eq('user_id', user.id).eq('course_id', courseId).eq('status', 'completed')

    if (allLessons && completedLessons && completedLessons.length >= allLessons.length) {
        // Issue certificate
        const { data: existingCert } = await supabase.from('training_certificates')
            .select('id').eq('user_id', user.id).eq('course_id', courseId).single()

        if (!existingCert) {
            const certNumber = `NOVO-${Date.now().toString(36).toUpperCase()}`
            await supabase.from('training_certificates').insert({
                user_id: user.id, course_id: courseId, certificate_number: certNumber
            })
        }
    }

    revalidatePath('/training')
    return { success: true }
}

export async function submitQuizAnswer(courseId: string, lessonId: string, answers: Record<string, number>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get questions
    const { data: questions } = await supabase.from('training_quiz_questions')
        .select('id, correct_answer').eq('lesson_id', lessonId)

    if (!questions) throw new Error('Sorular bulunamadı')

    let correct = 0
    questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) correct++
    })

    const score = Math.round((correct / questions.length) * 100)

    // Save progress
    const { data: existing } = await supabase.from('training_progress')
        .select('id').eq('user_id', user.id).eq('course_id', courseId).eq('lesson_id', lessonId).single()

    const isCompleted = score >= 70 // passing score
    const update = {
        status: isCompleted ? 'completed' as const : 'in_progress' as const,
        score,
        completed_at: isCompleted ? new Date().toISOString() : null,
    }

    if (existing) {
        await supabase.from('training_progress').update(update).eq('id', existing.id)
    } else {
        await supabase.from('training_progress').insert({
            user_id: user.id, course_id: courseId, lesson_id: lessonId, ...update
        })
    }

    revalidatePath('/training')
    return { success: true, score, correct, total: questions.length, passed: isCompleted }
}
