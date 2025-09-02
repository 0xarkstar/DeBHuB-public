import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  const AuthRoles = await ethers.getContractFactory("AuthRoles");
  const authRoles = await AuthRoles.deploy();
  await authRoles.waitForDeployment();
  
  const authRolesAddress = await authRoles.getAddress();
  console.log("AuthRoles deployed to:", authRolesAddress);

  const Posts = await ethers.getContractFactory("Posts");
  const posts = await Posts.deploy(authRolesAddress);
  await posts.waitForDeployment();
  
  const postsAddress = await posts.getAddress();
  console.log("Posts deployed to:", postsAddress);

  console.log("Contract addresses:");
  console.log("AuthRoles:", authRolesAddress);
  console.log("Posts:", postsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });