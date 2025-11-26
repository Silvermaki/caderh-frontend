import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import process from 'process';

const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({ session, token }: { session: any, token: any }) {
            if (session && token) {
                session.user.id = token.id;
                session.user.session = token.session;
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role;
                session.user.challenge = token.challenge;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.session = (user as any).session;
                token.email = (user as any).email;
                token.name = (user as any).name;
                token.role = (user as any).role;
                token.challenge = (user as any).challenge;
            }
            return token
        },
        async signIn({ user }) {
            if ((user as any).challenge) {
                throw new Error(JSON.stringify({
                    id: (user as any).id,
                    session: (user as any).session,
                    email: (user as any).email,
                    name: (user as any).name,
                    role: (user as any).role,
                    challenge: (user as any).challenge,
                }));
            }
            return true;
        }
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "Username" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                if (!credentials) return null;
                try {
                    const auth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.username,
                            password: credentials.password,
                        })
                    });
                    const response = await auth.json();
                    if (auth.status === 400) {
                        throw new Error(response.message);
                    } else {
                        console.log(response);
                        const user = {
                            id: response.email,
                            session: response.session,
                            email: response.email,
                            name: response.name,
                            role: response.role,
                            challenge: response.first_login ? "FIRST_LOGIN" : false
                        };
                        return user;
                    }
                } catch (error: any) {
                    console.log(`${(new Date).toLocaleString()} - Error during log in for user ${credentials.username}`, { name: error.name, message: error.message });
                    return null;
                }
            }
        })
    ]
}
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }