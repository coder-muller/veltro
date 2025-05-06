import axios from "axios";

export async function getMe(): Promise<{ userId: string, userName: string, userEmail: string } | null> {
    try {
        const response = await axios.get("/api/auth/me");
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}
