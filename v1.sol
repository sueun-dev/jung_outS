// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Valen is ERC721A, Ownable {
    uint256 MAX_MINTS = 10;
    uint256 public MAX_SUPPLY = 8525;
    uint256 public PRICE_PER_ETH = 0.12 ether;
    uint256 public WL_PRICE_PER_ETH = 0.1 ether;

    mapping(address => bool) public whitelisted;
    uint16 WL_MAX_SUPPLY = 2500;

    string private _baseTokenURI;
    string public notRevealedUri;

    bool public isSale = false;
    bool public WLisSale = false;
    bool public revealed = false;

    constructor(string memory baseTokenURI, string memory _initNotRevealedUri) ERC721A("Legendary League NFT", "LLN") {
        _baseTokenURI = baseTokenURI;
        setNotRevealedURI(_initNotRevealedUri);
    }

    function mintByETH(uint256 quantity) external payable {
        require(isSale, "Public sale is NOT start");
        // _safeMint's second argument now takes in a quantity, not a tokenId.
        require(quantity + _numberMinted(msg.sender) <= MAX_MINTS, "Exceeded the limit");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Not enough tokens left");
        require(msg.value >= (PRICE_PER_ETH * quantity), "Not enough ether sent");
        _safeMint(msg.sender, quantity);
    }

    function WLmintByETH(uint256 quantity) external payable {
        require(WLisSale, "White-List Sale is NOT start");
        require(whitelisted[msg.sender] == true, "You are not white list");
        require(quantity + _numberMinted(msg.sender) <= MAX_MINTS, "Exceeded the limit");
        require(totalSupply() + quantity <= WL_MAX_SUPPLY, "Not enough tokens left");
        require(msg.value >= (WL_PRICE_PER_ETH * quantity), "Not enough ether sent");
        _safeMint(msg.sender, quantity);
    }

    function developerPreMint(uint256 quantity) public onlyOwner {
        require(!isSale, "Not Start");
        // _safeMint's second argument now takes in a quantity, not a tokenId.
        require(quantity + _numberMinted(msg.sender) <= 5, "Exceeded the limit"); // 600개까지 딱 가지고있을수있음
        require(totalSupply() + quantity <= 5, "Not enough tokens left"); // 토큰 600개 제한
        _safeMint(msg.sender, quantity);
    }

    function withdraw() external payable onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function getBaseURI() public view returns (string memory) {
        return _baseURI();
    }

    function _baseURI() internal view virtual override returns (string memory) {

        if(revealed) { 
        return notRevealedUri; }

        return _baseTokenURI;
    }

    function setSale() public onlyOwner {
        isSale = !isSale;
    }

    function WLsetSale() public onlyOwner {
        WLisSale = !WLisSale;
    }

    function getWLpublicSale() public view returns (uint256) {
        return WL_PRICE_PER_ETH;
    }

    function getpublicSale() public view returns (uint256) {
        return PRICE_PER_ETH;
    }

    function addWhitelist(address[] memory _users) public onlyOwner {
        uint size = _users.length;
       
        for (uint256 i=0; i< size; i++){
          address user = _users[i];
          whitelisted[user] = true;
        }
    }

    function removeWhitelist(address[] memory _users) public onlyOwner {
        uint size = _users.length;
        
        for (uint256 i=0; i< size; i++){
          address user = _users[i];
          whitelisted[user] = false;
        }
    }
}