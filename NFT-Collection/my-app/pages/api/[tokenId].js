// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Base URI + TokenID
// Base URI = https://web3-ck83z5mvm-nmawungwe.vercel.app/api/
// Token ID = 1 
// tokenURI(1) => https://web3-ck83z5mvm-nmawungwe.vercel.app/api/1

export default function handler(req, res) {
 
    const tokenId = req.query.tokenId;

    const name = `Crypto Dev #${tokenId}`;
    const description = "CryptoDevs is an NFT collection for Web3 developers. LFG.";
    const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${
                    Number(tokenId - 1)
                    }.svg`;

    return res.json({
        name: name,
        description: description,
        image: image
    });
    
}
