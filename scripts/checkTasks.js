const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0ED1a54FEAA259BA110720D7ec420d76397343Ce";
  const userAddress = "0x25b7a7d21cCf349fbA8245209A25Bbb36fBe4ffD";

  const EncryptedTasks = await hre.ethers.getContractFactory("EncryptedTasks");
  const tasks = EncryptedTasks.attach(contractAddress);

  console.log("📋 Checking tasks for:", userAddress);
  
  try {
    const taskCount = await tasks.getTasksCount();
    console.log("📊 Total task count:", taskCount.toString());

    const myTasks = await tasks.getMyTasks();
    console.log("📦 My tasks:", myTasks.length);
    
    if (myTasks.length > 0) {
      console.log("\n📝 Tasks:");
      myTasks.forEach((task, i) => {
        console.log(`\nTask ${i}:`);
        console.log("  ID:", task.id.toString());
        console.log("  Title:", task.title);
        console.log("  Status:", task.status);
        console.log("  Priority:", task.priority);
        console.log("  Owner:", task.owner);
      });
    } else {
      console.log("❌ No tasks found");
    }

    const stats = await tasks.getMyStats();
    console.log("\n📊 Stats:");
    console.log("  Total:", stats.totalTasks.toString());
    console.log("  Todo:", stats.todoTasks.toString());
    console.log("  In Progress:", stats.inProgressTasks.toString());
    console.log("  Completed:", stats.completedTasks.toString());
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
