function scheduler(action, ms = 1000, runRightNow = true) {
    if (runRightNow) action();
    setInterval(action, ms);
  }
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  const config = {
    contracts: {
      ERC721: {
        abi: abi.ERC721,
        address: '0x8f7769E30f4b68f47FB1929009A7F05A0c08c258',
      },
    },
    network: {
      chainName: 'Ethereum',
      chainId: 4,
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
      blockExplorerUrls: ['https://rinkeby.etherscan.io/'],
    },
  };
  const App = {
    web3Provider: null,
    currentAccount: null,
    connected: false,

    init: async function () {
      await App.initWeb3();
      await ERC721.init();


      if (pageName === 'NFT') {
        await ERC721.pageInit();
      }
    },
    initWeb3: async function () {
      App.web3Provider = new Web3.providers.HttpProvider(
        config.network.rpcUrls[0],
      ); // Connect Node
      window.web3 = new Web3(App.web3Provider);

      if (window.ethereum) {
        try {
          await App.connect();
          await App.chnaged();
        } catch (error) {
          if (error.code === 4001) {
            // User rejected request
            alert('Please Connect MetaMask');
          }
          console.log(error);
        }
      } else {
        alert('There is no Metamask. Please install MetaMask.');
      }
    },

    switchNetwork: async function () {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x' + config.network.chainId.toString(16),
            chainName: config.network.chainName,
            nativeCurrency: config.network.nativeCurrency,
            rpcUrls: config.network.rpcUrls,
            blockExplorerUrls: config.network.blockExplorerUrls,
          },
        ],
      });
    },

    connect: async function () {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      App.currentAccount = accounts[0];
      App.connected = true;
    },

    chnaged: async function () {
      ethereum.on('accountsChanged', async () => {
        await App.connect();
      });
    },

    CheckId: async function () {
     var myAddress = window.ethereum.selectedAddress;
     var StartAddress = myAddress.substring(1,6);
     var EndAddress = myAddress.substring(37, myAddress.length);
     document.getElementById("Account").innerHTML = "Your MetaMask Address : " + StartAddress + "...." + EndAddress;
    },

    ConnectId: async function() {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      App.currentAccount = accounts[0];
      App.connected = true;
    },
  };
  
  const ERC721 = {
    contract: null,
    baseURI: '',
  
    init: async function () {
      this.contract = new web3.eth.Contract(
        config.contracts.ERC721.abi,
        config.contracts.ERC721.address,
      );
    },
    
    pageInit: async function () {
      scheduler(this.writeTotalSupply, 1000);

      this.baseURI = await this.getBaseURI();
      if (App.connected) this.showMyNFTs();
    },
  
    getBaseURI: async function () {
      return await ERC721.contract.methods.getBaseURI().call();
    },
    getMaxSupply: async function () {
      return await ERC721.contract.methods.MAX_SUPPLY().call();
    },
    getTotalSupply: async function () {
      return await ERC721.contract.methods.totalSupply().call();
    },
    getBalanceOf: async function (address) {
      return await ERC721.contract.methods.balanceOf(address).call();
    },
    getOwnerOf: async function (address) {
      return await ERC721.contract.methods.ownerOf(address).call();
    },
    sendToken: async function (tokenID, toAddress) {
      if (!toAddress) {alert('Canceled');}
      else (`send #${tokenID} to ${toAddress}...`);
      const evmData = ERC721.contract.methods
        .transferFrom(App.currentAccount, toAddress, tokenID)
        .encodeABI();

      const params = [
        {
          from: App.currentAccount,
          to: config.contracts.ERC721.address,
          data: evmData,
          value: '0x0',
        },
      ];
      ethereum
        .request({
          method: 'eth_sendTransaction',
          params,
        })
        .then((result) => {
          alert.close();
          console.log(result);
        })
        .catch((error) => {
          console.error(error);
        });
    },


    getMetadata: async function (tokenId) {
      const tokenURI = ERC721.baseURI + tokenId;
      const result = await fetch(tokenURI);
      return await result.json();
    },
  
    clickTokenTransfer: async function (tokenId) {
      const toAddress = prompt(`send your #${tokenId}, input toAddress`);
      if (!toAddress) alert('input valid ToAddress');
      ERC721.sendToken(tokenId, toAddress);
    },
  //카드카드카드카드카드
    makeNFTElement: function (tokenId, imagePath) {
      const div = document.createElement('div');
      div.classList.add('col');
      div.style = 'width: 33%;';
      {
        // card
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('h-100');
        div.appendChild(card);
        div.onclick = function () {
          ERC721.clickTokenTransfer(tokenId);
        };
        {
          // image
          const img = document.createElement('img');
          img.classList.add('card-img-top');
          img.src = imagePath;
          img.alt = '...refresh homepage please';
          card.appendChild(img);
        }
        {
          // desc
          const cardBody = document.createElement('div');
          cardBody.classList.add('card-body');
  
          const title = document.createElement('p');
          title.classList.add('card-title');
          title.innerText = `#${tokenId}`;
          cardBody.appendChild(title);

          card.appendChild(cardBody);
        }
      }
      return div;
    },
    appendNFT: async function (tokenId) {
      const metadata = await ERC721.getMetadata(tokenId);
      const nftElement = ERC721.makeNFTElement(
        tokenId,
        metadata.image,
        metadata.attributes,
      );
      document.getElementById('my-nft-list').appendChild(nftElement);

      const tmp = document.querySelector('#my-nft-list span');
      if (tmp) {
        tmp.remove();
      }
    },

    showMyNFTs: async function () {
      const balance = await ERC721.getBalanceOf(App.currentAccount);
      const total = await ERC721.getTotalSupply();
      let ownerCount = 0;
      
      for (const index of Array.from(Array(Number(total)).keys())) {
        const tokenId = index;
        const owner = await ERC721.getOwnerOf(tokenId);
          if (owner.toLowerCase() == App.currentAccount.toLowerCase()) {
            ownerCount += 1;
            ERC721.appendNFT(tokenId);
            await sleep(700); // for Pinata GWS req limit
            if (balance <= ownerCount) break;
        } 
      }
    },

    writeTotalSupply: async function () {
        document.getElementById('total-supply').innerHTML =
        await ERC721.getTotalSupply();
      },

    getIsSale: async function () {
        return await ERC721.contract.methods.isSale().call();
      },

    getWLIsSale: async function () {
        return await ERC721.contract.methods.WLisSale().call();
      },

    getIsSale: async function () {
        return await ERC721.contract.methods.isSale().call();
      },
    
    getWLIsSale: async function () {
        return await ERC721.contract.methods.WLisSale().call();
      },
    
    mintWithETH: async function () {
        const isSale = await ERC721.getIsSale();
        var getMyPirce = 0.12;
        if (!isSale) {
          alert('The sale has not started.');
          return;
       }
        const numberOfTokens = document.getElementById('number-of-tokens').value;
        if (numberOfTokens > 5)
          return alert('only mint 5 NFT at a time');
        const value = new BigNumber(web3.utils.toWei(numberOfTokens, 'ether'))
          .multipliedBy(getMyPirce)
          .toFixed();

        const evmData = ERC721.contract.methods
          .mintByETH(numberOfTokens)
          .encodeABI();
  
        ERC721.sendMint(web3.utils.toHex(value), evmData);
      },

    WLmintWithETH: async function () {
        const WLisSale = await ERC721.getWLIsSale();
        var getMyWLPrice = 0.1;
        if (!WLisSale) {
          alert('The sale has not started.');
          return;
       }
        const numberOfTokens1 = document.getElementById('number-of-tokens1').value;
        if (numberOfTokens1 > 5)
          return alert('only mint 5 NFT at a time');
        const value = new BigNumber(web3.utils.toWei(numberOfTokens1, 'ether'))
          .multipliedBy(getMyWLPrice)
          .toFixed();

        const evmData = ERC721.contract.methods
        //WLmintByETH인지 mintByETH인지 꼮 확인 !!!!!
          .WLmintByETH(numberOfTokens1)
          .encodeABI();
    
        ERC721.sendWLMint(web3.utils.toHex(value), evmData);
      },

    sendMint: async function (value, evmData) {
        const params = [
          {
            from: App.currentAccount,
            to: config.contracts.ERC721.address,
            data: evmData,
            value,
          },
        ];
        ethereum
          .request({
            method: 'eth_sendTransaction',
            params,
          })
          .then((result) => {
            console.log(result);
          })
          .catch((error) => {
            console.error(error);
          });
      },
  
    sendWLMint: async function (value, evmData) {
        const params = [
          {
            from: App.currentAccount,
            to: config.contracts.ERC721.address,
            data: evmData,
            value,
          },
        ];
        ethereum
          .request({
          method: 'eth_sendTransaction',
          params,
        })
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.error(error);
        });
    },
  };

  
App.init();