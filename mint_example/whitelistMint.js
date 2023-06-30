const bitcoin = require('bitcoinjs-lib') // v3.x.x
const bitcoinMessage = require('bitcoinjs-message')
const tinysecp = require('tiny-secp256k1');
const crypto = require('crypto');
const {ECPairFactory} = require("ecpair")
const ECPair = ECPairFactory(tinysecp);

const parent = {
    "p": "src-721",
    "v": 1,
    "op": "deploy",
    "name": "Collection Name",      // The display name of the collection
    "symbol": "SYM",                // the symbol for the collection
    "description": "Description",
    "unique": true,                 // determines if a set of traits must be unique to be valid
    "supply": 4,           // merkle root for a permissioned mint [optional]
    "type": "data:image/png;base64",// mime type of the images used in traits t0-tx
    "image-rendering":"pixelated",  // css property to ensure images are displayed properly [optional]
    "viewbox": "0 0 160 160",       // viewbox to properly see  traits t0-tx
    "max": 2500,                    // maximum number of mints
    "lim": 1,                       // limit per mint
    "icon": "A16308540544056654000",// CP asset for a collection icon 
    // All t0-tx are optional if the reveal op is planned to be used
    "pubkey": "a1b2...e8d9"  ,       // pubkey for future ops such as reveal [optional]
    "operator": "1F5VhMHukdnUES9kfXqzPzMeF1GPHKiF64",
    "t0": ["A12430899936789156000", "A9676658320305385000"],    // up to x layers of stamp traits (references by CP asset#) containing
    "t1": ["A17140023175661332000", "A6689685157378600000"],    // transparency can be stacked on top of eachother to form a final image
    // ...
    "tx": ["A12240402677681132000", "A4332886198473102000"]
}

var tokens = [
    {
        "p": "src-721",
        "op": "mint",
        "symbol": "SYM",
        "ts":[1,2,3,4],
        "id": 1,
        "sig": undefined
    },
    {
        "p": "src-721",
        "op": "mint",
        "symbol": "SYM",
        "ts":[2,3,4,1],
        "id": 2,
        "sig": undefined
    },
    {
        "p": "src-721",
        "op": "mint",
        "symbol": "SYM",
        "ts":[3,4,1,2],
        "id": 3,
        "sig": undefined
    },
    {
        "p": "src-721",
        "op": "mint",
        "symbol": "SYM",
        "ts":[4,1,2,3],
        "id": 4,
        "sig": undefined
    },
    

]

const whitelist = ["n3GweYyT7KqTJ8k4fN4Y81MWdwhoBWJfXa",
                    "mwEviFb2zmnnopPpoxxHdisacYBRmmwtoj",
                    "ms4hMfAdnsmfFEKUpxKhrYLpH2yv8pqcP3",
                    "mpXga6hEesdqsg7cGgh5X5b7EJ7GgnHhy3",
                    "mpLK8HkWRtQNDY1dm4DoVwmjSTicvNR4gb"]



// Generates Operator for this example  ------------------------------------------------------------------
function rng () {
    return Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
  } // get a much more secure random
  
  const keyPair = ECPair.makeRandom({ rng: rng })
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey })
  console.log("Operator address: " + address) // 17wqX8P6kz6DrDRQfdJ9KeqUTRmgh1NzSk
  var publicKey = keyPair.publicKey.toString('hex')
  
  console.log("Operator public key " + publicKey) // 0279bf075bae171835513be1056f224f94f3915f9999a3faea1194d97b54397219
  
  const privateKey = Buffer.from(keyPair.privateKey)
  console.log("Operator private key: " + privateKey) 

//--------------------------------------------------------------------------------------------------------

function sign(trait){
    var signature = bitcoinMessage.sign(trait, privateKey, keyPair.compressed)
    return(signature.toString("base64"))
}

function createSignatures(tokens, whitelist){
    var populatedTokens = tokens.map((trait, i) => 
        {   
            var toHash = trait.id + JSON.stringify(trait.ts) + whitelist[i]
            var hash = crypto.createHash('sha256').update(toHash).digest('hex')
            trait.sig = sign(hash)


            return(trait)
        })

        return(populatedTokens)
}


const finalTokens = createSignatures(tokens, whitelist)
console.log(finalTokens)




//  prove that the trait is signed by the operator
var signature = finalTokens[0].sig



//  returns true
var creator = whitelist[0]
var toHash = finalTokens[0].id + JSON.stringify(finalTokens[0].ts) + creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')
console.log(bitcoinMessage.verify(message, address, signature))

//  returns true
var signature2 = finalTokens[2].sig
var creator = whitelist[2]
var toHash = finalTokens[2].id + JSON.stringify(finalTokens[2].ts) + creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')
console.log(bitcoinMessage.verify(message, address, signature2))


//  returns false
var fake_creator = "1HsoLKovnGwkiDmoUF9rj2X78GPFczoUuk"
var toHash = finalTokens[0].id + JSON.stringify(finalTokens[0].ts) + fake_creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')
console.log(bitcoinMessage.verify(message, address, signature))

//  returns false
var creator = whitelist[0]
var toHash = finalTokens[0].id + JSON.stringify([4,1,2,3]) + creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')
console.log(bitcoinMessage.verify(message, address, signature))

//  returns false
var fake_id = 3
var toHash = fake_id + JSON.stringify(finalTokens[0].ts) + creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')
console.log(bitcoinMessage.verify(message, address, signature))



//  returns false
var fake_operator = "1HsoLKovnGwkiDmoUF9rj2X78GPFczoUuk"
var toHash = finalTokens[0].id + JSON.stringify(finalTokens[0].ts) + creator
var message = crypto.createHash('sha256').update(toHash).digest('hex')

console.log(bitcoinMessage.verify(message, fake_operator, signature))
