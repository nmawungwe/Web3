import Link from "next/link"
import Head from "next/head"
import Container from "../../components/container"

export default function FirstPost(props) {
    return(
        <>
            <Container>
            <Head>
                <title>My First Post</title>
            </Head>
            <h1>My First Post</h1>
            <h2>
                <Link href="/">
                    <a>Home</a>
                </Link>
            </h2>
            <h3>size: {props.size}</h3>
            <br/>
            {/* <img src="/doge.png" alt="Dogecoin logo"/> */}
            </Container>
        </>

    ) 
}

export async function getServerSideProps(context) {
    const res = await fetch('https://api.github.com/repos/vercel/next.js')
    const json = await res.json()
    return {
        props: { size: json.size }
    }
} 