const StarNotary = artifacts.require("StarNotary");
const truffleAssert = require('truffle-assertions');

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    //1. Create a star
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let tokenId = 10;
    let instance = await StarNotary.deployed();
    await instance.createStar('Another Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.name.call(), 'Udacity Star Token')
    assert.equal(await instance.symbol.call(), 'UST')
});

it('lets 2 users exchange stars', async() => {
    // 1. Create 2 Stars
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed
    let instance = await StarNotary.deployed();
    // Create Star 1
    let tokenId1 = 101;
    let owner1 = accounts[1];
    await instance.createStar('New Star 1', tokenId1, {from: owner1});
    // Create Star 2
    let tokenId2 = 102;
    let owner2 = accounts[2];
    await instance.createStar('New Star 2', tokenId2, {from: owner2});
    // Test 1: Exchange stars request sent by owner 1
    await instance.exchangeStars(tokenId1, tokenId2, {from: owner1});
    // Verify starts have changed owners
    let token1NewOwner = await instance.ownerOf.call(tokenId1);
    let token2NewOwner = await instance.ownerOf.call(tokenId2);
    assert.equal(token1NewOwner, owner2)
    assert.equal(token2NewOwner, owner1)
    // Test 2: Exchange stars back request sent by owner 2
    await instance.exchangeStars(tokenId1, tokenId2, {from: owner2});
    // Verify starts have changed owners
    let token1OriginalOwner = await instance.ownerOf.call(tokenId1);
    let token2OriginalOwner = await instance.ownerOf.call(tokenId2);
    assert.equal(token1OriginalOwner, owner1)  // Start back at original owners
    assert.equal(token2OriginalOwner, owner2)
    // NOTE: Due to renaming symmetry it is not neccessary to test
    // exchangeStars(tokenId2, tokenId1)
    // Test 3: Exchange stars back request sent by incorrect owner - reverts
    let ownerRandom = accounts[7];
    await truffleAssert.reverts(instance.exchangeStars(tokenId1, tokenId2, {from: ownerRandom}));
});

it('lets a user transfer a star', async() => {
    // 1. create a Star
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.
    let instance = await StarNotary.deployed();
    // Create Star 1
    let tokenId = 201;
    let owner1 = accounts[1];
    let owner2 = accounts[2];
    await instance.createStar('New Star 1', tokenId, {from: owner1});
    // Transfer star to owner 2
    await instance.transferStar(owner2, tokenId, {from: owner1});
    let tokenNewOwner = await instance.ownerOf.call(tokenId);
    assert.equal(tokenNewOwner, owner2)
    // Transfer back by incorrect owner - reverts
    let ownerRandom = accounts[7];
    await truffleAssert.reverts(instance.transferStar(owner1, tokenId, {from: ownerRandom}));
});
