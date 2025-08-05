import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
import dbConnect from '@/db';
// import { authOptions } from '../../auth/[...nextauth]/options';
import SessionModel from '@/models/session.model';
// import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
// import { SessionModel } from '@/models/SessionModel';
// import dbConnect from '@/lib/dbConnect';

export async function GET(req: NextRequest) {
    await dbConnect();

    // const session = await getServerSession(authOptions);
    // if (!session || !session.user?.id) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    
    const sessionId = searchParams.get('sessionId');
    console.log(sessionId)
    // const userId = session.user.id;

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

        const sessionDoc = await SessionModel.findOne({ _id: sessionId});
    if (!sessionDoc) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ context: sessionDoc.context });
}