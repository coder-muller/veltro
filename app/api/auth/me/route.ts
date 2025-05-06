import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {

    const token = await (await cookies()).get("token");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({ error: "JWT secret not found" }, { status: 500 });
    }

    try {
        jwt.verify(token.value, secret);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await (await cookies()).get("userId");
    const userName = await (await cookies()).get("userName");
    const userEmail = await (await cookies()).get("userEmail");

    if (!userId || !userName || !userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ userId: userId.value, userName: userName.value, userEmail: userEmail.value }, { status: 200 });
}