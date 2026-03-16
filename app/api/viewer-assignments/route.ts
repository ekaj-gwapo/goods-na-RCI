import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET viewer's assigned entry users
export async function GET(request: NextRequest) {
  try {
    const viewerId = request.nextUrl.searchParams.get('viewerId')

    if (!viewerId) {
      return NextResponse.json(
        { error: 'Viewer ID required' },
        { status: 400 }
      )
    }

    const { data: assignments, error } = await supabase
      .from('viewer_access')
      .select(`
        *,
        users!viewer_access_entry_user_id_fkey (
          email
        )
      `)
      .eq('viewer_id', viewerId)

    if (error) throw error

    // Map and flatten for frontend
    const mappedAssignments = assignments.map((va: any) => ({
      ...va,
      viewerId: va.viewer_id,
      entryUserId: va.entry_user_id,
      email: va.users?.email,
      createdAt: va.created_at,
    }))

    return NextResponse.json(mappedAssignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST new viewer assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { viewerId, entryUserId } = body

    if (!viewerId || !entryUserId) {
      return NextResponse.json(
        { error: 'Viewer ID and Entry User ID required' },
        { status: 400 }
      )
    }

    const { data: assignment, error } = await supabase
      .from('viewer_access')
      .insert([
        {
          viewer_id: viewerId,
          entry_user_id: entryUserId,
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Postgres Unique Violation
        return NextResponse.json(
          { error: 'Assignment already exists' },
          { status: 400 }
        )
      }
      throw error
    }

    // Map back to camelCase
    const mappedAssignment = {
      ...assignment,
      viewerId: assignment.viewer_id,
      entryUserId: assignment.entry_user_id,
      createdAt: assignment.created_at,
    }

    return NextResponse.json(mappedAssignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// DELETE viewer assignment
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('viewer_access')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
