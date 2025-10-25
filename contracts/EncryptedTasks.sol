// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint32, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedTasks
 * @notice Privacy-first task management using Zama FHE
 * @dev Users can create, manage, and complete encrypted tasks with full privacy
 */
contract EncryptedTasks is SepoliaConfig {
    
    // ============ Structs ============
    
    enum TaskStatus { Todo, InProgress, Completed }
    enum Priority { Low, Medium, High }
    
    struct Task {
        uint256 id;
        address owner;
        euint32[] encryptedDescription;  // Encrypted task details
        string title;                     // Plain text for quick view
        TaskStatus status;                // Todo, InProgress, Completed
        Priority priority;                // Low, Medium, High
        uint256 dueDate;                  // Unix timestamp (0 = no due date)
        string category;                  // Project/category
        string[] tags;                    // Tags for organization
        uint256 createdAt;
        uint256 updatedAt;
        uint256 completedAt;              // When task was completed
        uint8 chunkCount;
        bool isArchived;
        bool isFavorite;
        string color;                     // Color code for visual organization
    }
    
    struct TaskMetadata {
        uint256 id;
        string title;
        TaskStatus status;
        Priority priority;
        uint256 dueDate;
        string category;
        string[] tags;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 completedAt;
        uint8 chunkCount;
        bool isArchived;
        bool isFavorite;
        string color;
        address owner;  // Owner address for shared tasks
    }
    
    struct UserStats {
        uint256 totalTasks;
        uint256 todoTasks;
        uint256 inProgressTasks;
        uint256 completedTasks;
        uint256 archivedTasks;
        uint256 favoriteTasks;
        uint256 overdueTasks;
        uint256 totalStorage;      // Total chunks used
    }
    
    // ============ Storage ============
    
    struct SharedTaskReference {
        address owner;
        uint256 taskId;
    }
    
    mapping(address => Task[]) private userTasks;
    mapping(address => UserStats) public userStats;
    mapping(address => mapping(string => uint256[])) private tasksByCategory;
    mapping(address => mapping(string => uint256[])) private tasksByTag;
    mapping(address => SharedTaskReference[]) private sharedWithMe;
    
    uint256 public constant MAX_CHUNKS_PER_TASK = 128;  // ~512 bytes max
    uint256 public constant MAX_TASKS_PER_USER = 1000;
    
    // ============ Events ============
    
    event TaskCreated(address indexed owner, uint256 indexed taskId, string title, Priority priority);
    event TaskUpdated(address indexed owner, uint256 indexed taskId, string title);
    event TaskDeleted(address indexed owner, uint256 indexed taskId);
    event TaskStatusChanged(address indexed owner, uint256 indexed taskId, TaskStatus newStatus);
    event TaskPriorityChanged(address indexed owner, uint256 indexed taskId, Priority newPriority);
    event TaskArchived(address indexed owner, uint256 indexed taskId, bool archived);
    event TaskFavorited(address indexed owner, uint256 indexed taskId, bool favorited);
    event TaskShared(address indexed owner, uint256 indexed taskId, address indexed sharedWith);
    
    // ============ Modifiers ============
    
    modifier taskExists(uint256 taskId) {
        require(taskId < userTasks[msg.sender].length, "Task does not exist");
        _;
    }
    
    modifier withinLimits(uint256 chunksLength) {
        require(chunksLength > 0, "Empty task");
        require(chunksLength <= MAX_CHUNKS_PER_TASK, "Task too large");
        require(userStats[msg.sender].totalTasks < MAX_TASKS_PER_USER, "Max tasks reached");
        _;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new encrypted task
     * @param encryptedChunks Encrypted task description chunks
     * @param inputProof FHE proof data
     * @param title Plain text title
     * @param priority Task priority (Low, Medium, High)
     * @param dueDate Due date timestamp (0 for no due date)
     * @param category Plain text category
     * @param tags Array of plain text tags
     * @param color Color code for visual organization
     */
    function createTask(
        externalEuint32[] calldata encryptedChunks,
        bytes calldata inputProof,
        string calldata title,
        Priority priority,
        uint256 dueDate,
        string calldata category,
        string[] calldata tags,
        string calldata color
    ) external withinLimits(encryptedChunks.length) returns (uint256 taskId) {
        require(bytes(title).length > 0, "Title required");
        
        // Convert external encrypted values to internal euint32
        euint32[] memory chunks = new euint32[](encryptedChunks.length);
        for (uint256 i = 0; i < encryptedChunks.length; i++) {
            chunks[i] = FHE.fromExternal(encryptedChunks[i], inputProof);
            
            // Grant decryption permission to owner
            FHE.allow(chunks[i], msg.sender);
            
            // Allow contract access
            FHE.allowThis(chunks[i]);
        }
        
        taskId = userTasks[msg.sender].length;
        
        Task storage task = userTasks[msg.sender].push();
        task.id = taskId;
        task.owner = msg.sender;
        task.title = title;
        task.status = TaskStatus.Todo;
        task.priority = priority;
        task.dueDate = dueDate;
        task.category = category;
        task.tags = tags;
        task.createdAt = block.timestamp;
        task.updatedAt = block.timestamp;
        task.completedAt = 0;
        task.chunkCount = uint8(encryptedChunks.length);
        task.isArchived = false;
        task.isFavorite = false;
        task.color = color;
        
        // Store encrypted chunks
        for (uint256 i = 0; i < chunks.length; i++) {
            task.encryptedDescription.push(chunks[i]);
        }
        
        // Update stats
        userStats[msg.sender].totalTasks++;
        userStats[msg.sender].todoTasks++;
        userStats[msg.sender].totalStorage += encryptedChunks.length;
        
        // Index by category
        if (bytes(category).length > 0) {
            tasksByCategory[msg.sender][category].push(taskId);
        }
        
        // Index by tags
        for (uint256 i = 0; i < tags.length; i++) {
            tasksByTag[msg.sender][tags[i]].push(taskId);
        }
        
        emit TaskCreated(msg.sender, taskId, title, priority);
    }
    
    /**
     * @notice Update an existing task's content
     * @param taskId ID of the task to update
     * @param encryptedChunks New encrypted content
     * @param inputProof FHE proof data
     * @param title New title
     * @param priority New priority
     * @param dueDate New due date
     * @param category New category
     * @param tags New tags
     * @param color New color
     */
    function updateTask(
        uint256 taskId,
        externalEuint32[] calldata encryptedChunks,
        bytes calldata inputProof,
        string calldata title,
        Priority priority,
        uint256 dueDate,
        string calldata category,
        string[] calldata tags,
        string calldata color
    ) external taskExists(taskId) {
        require(encryptedChunks.length > 0, "Empty task");
        require(encryptedChunks.length <= MAX_CHUNKS_PER_TASK, "Task too large");
        require(bytes(title).length > 0, "Title required");
        
        Task storage task = userTasks[msg.sender][taskId];
        
        // Update storage stats
        userStats[msg.sender].totalStorage -= task.chunkCount;
        userStats[msg.sender].totalStorage += encryptedChunks.length;
        
        // Clear old chunks
        delete task.encryptedDescription;
        
        // Convert and store new chunks
        for (uint256 i = 0; i < encryptedChunks.length; i++) {
            euint32 chunk = FHE.fromExternal(encryptedChunks[i], inputProof);
            FHE.allow(chunk, msg.sender);
            FHE.allowThis(chunk);
            task.encryptedDescription.push(chunk);
        }
        
        // Update metadata
        task.title = title;
        task.priority = priority;
        task.dueDate = dueDate;
        task.category = category;
        task.tags = tags;
        task.color = color;
        task.chunkCount = uint8(encryptedChunks.length);
        task.updatedAt = block.timestamp;
        
        emit TaskUpdated(msg.sender, taskId, title);
    }
    
    /**
     * @notice Delete a task permanently
     * @param taskId ID of the task to delete
     */
    function deleteTask(uint256 taskId) external taskExists(taskId) {
        Task storage task = userTasks[msg.sender][taskId];
        
        // Update stats
        userStats[msg.sender].totalStorage -= task.chunkCount;
        
        if (task.status == TaskStatus.Todo) {
            userStats[msg.sender].todoTasks--;
        } else if (task.status == TaskStatus.InProgress) {
            userStats[msg.sender].inProgressTasks--;
        } else if (task.status == TaskStatus.Completed) {
            userStats[msg.sender].completedTasks--;
        }
        
        if (task.isArchived) {
            userStats[msg.sender].archivedTasks--;
        }
        if (task.isFavorite) {
            userStats[msg.sender].favoriteTasks--;
        }
        
        // Clear encrypted data
        delete task.encryptedDescription;
        
        // Mark as deleted by clearing owner
        task.owner = address(0);
        
        emit TaskDeleted(msg.sender, taskId);
    }
    
    /**
     * @notice Update task status (Todo, InProgress, Completed)
     * @param taskId ID of the task
     * @param newStatus New status
     */
    function updateTaskStatus(uint256 taskId, TaskStatus newStatus) external taskExists(taskId) {
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        if (task.status != newStatus) {
            // Update stats - decrement old status
            if (task.status == TaskStatus.Todo) {
                userStats[msg.sender].todoTasks--;
            } else if (task.status == TaskStatus.InProgress) {
                userStats[msg.sender].inProgressTasks--;
            } else if (task.status == TaskStatus.Completed) {
                userStats[msg.sender].completedTasks--;
            }
            
            // Update stats - increment new status
            if (newStatus == TaskStatus.Todo) {
                userStats[msg.sender].todoTasks++;
                task.completedAt = 0;
            } else if (newStatus == TaskStatus.InProgress) {
                userStats[msg.sender].inProgressTasks++;
                task.completedAt = 0;
            } else if (newStatus == TaskStatus.Completed) {
                userStats[msg.sender].completedTasks++;
                task.completedAt = block.timestamp;
            }
            
            task.status = newStatus;
            task.updatedAt = block.timestamp;
            
            emit TaskStatusChanged(msg.sender, taskId, newStatus);
        }
    }
    
    /**
     * @notice Update task priority
     * @param taskId ID of the task
     * @param newPriority New priority
     */
    function updateTaskPriority(uint256 taskId, Priority newPriority) external taskExists(taskId) {
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        if (task.priority != newPriority) {
            task.priority = newPriority;
            task.updatedAt = block.timestamp;
            
            emit TaskPriorityChanged(msg.sender, taskId, newPriority);
        }
    }
    
    /**
     * @notice Toggle archive status of a task
     * @param taskId ID of the task
     * @param archived True to archive, false to unarchive
     */
    function setArchived(uint256 taskId, bool archived) external taskExists(taskId) {
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        if (task.isArchived != archived) {
            task.isArchived = archived;
            task.updatedAt = block.timestamp;
            
            if (archived) {
                userStats[msg.sender].archivedTasks++;
            } else {
                userStats[msg.sender].archivedTasks--;
            }
            
            emit TaskArchived(msg.sender, taskId, archived);
        }
    }
    
    /**
     * @notice Toggle favorite status of a task
     * @param taskId ID of the task
     * @param favorite True to favorite, false to unfavorite
     */
    function setFavorite(uint256 taskId, bool favorite) external taskExists(taskId) {
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        if (task.isFavorite != favorite) {
            task.isFavorite = favorite;
            task.updatedAt = block.timestamp;
            
            if (favorite) {
                userStats[msg.sender].favoriteTasks++;
            } else {
                userStats[msg.sender].favoriteTasks--;
            }
            
            emit TaskFavorited(msg.sender, taskId, favorite);
        }
    }
    
    /**
     * @notice Share a task with another address (grant decryption access)
     * @param taskId ID of the task to share
     * @param recipient Address to share with
     */
    function shareTask(uint256 taskId, address recipient) external taskExists(taskId) {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot share with yourself");
        
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        // Grant decryption access to recipient
        for (uint256 i = 0; i < task.encryptedDescription.length; i++) {
            FHE.allow(task.encryptedDescription[i], recipient);
        }
        
        // Add to recipient's shared tasks list
        sharedWithMe[recipient].push(SharedTaskReference({
            owner: msg.sender,
            taskId: taskId
        }));
        
        emit TaskShared(msg.sender, taskId, recipient);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all task metadata for the caller
     * @return Array of task metadata
     */
    function getMyTasks() external view returns (TaskMetadata[] memory) {
        Task[] storage tasks = userTasks[msg.sender];
        TaskMetadata[] memory metadata = new TaskMetadata[](tasks.length);
        
        for (uint256 i = 0; i < tasks.length; i++) {
            metadata[i] = TaskMetadata({
                id: tasks[i].id,
                title: tasks[i].title,
                status: tasks[i].status,
                priority: tasks[i].priority,
                dueDate: tasks[i].dueDate,
                category: tasks[i].category,
                tags: tasks[i].tags,
                createdAt: tasks[i].createdAt,
                updatedAt: tasks[i].updatedAt,
                completedAt: tasks[i].completedAt,
                chunkCount: tasks[i].chunkCount,
                isArchived: tasks[i].isArchived,
                isFavorite: tasks[i].isFavorite,
                color: tasks[i].color,
                owner: msg.sender
            });
        }
        
        return metadata;
    }
    
    /**
     * @notice Get encrypted content handles for decryption
     * @param taskId ID of the task
     * @return handles Array of encrypted chunk handles
     * @return metadata Task metadata
     */
    function getTaskContent(uint256 taskId) 
        external 
        view 
        taskExists(taskId) 
        returns (bytes32[] memory handles, TaskMetadata memory metadata) 
    {
        Task storage task = userTasks[msg.sender][taskId];
        require(task.owner != address(0), "Task deleted");
        
        handles = new bytes32[](task.chunkCount);
        for (uint256 i = 0; i < task.chunkCount; i++) {
            handles[i] = FHE.toBytes32(task.encryptedDescription[i]);
        }
        
        metadata = TaskMetadata({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            category: task.category,
            tags: task.tags,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            completedAt: task.completedAt,
            chunkCount: task.chunkCount,
            isArchived: task.isArchived,
            isFavorite: task.isFavorite,
            color: task.color,
            owner: msg.sender
        });
    }
    
    // ============ Statistics ============
    
    /**
     * @notice Get tasks by category
     * @param category Category to filter by
     * @return Array of task IDs in that category
     */
    function getTasksByCategory(string calldata category) external view returns (uint256[] memory) {
        return tasksByCategory[msg.sender][category];
    }
    
    /**
     * @notice Get tasks by tag
     * @param tag Tag to filter by
     * @return Array of task IDs with that tag
     */
    function getTasksByTag(string calldata tag) external view returns (uint256[] memory) {
        return tasksByTag[msg.sender][tag];
    }
    
    /**
     * @notice Get user statistics
     * @return User's vault statistics
     */
    function getMyStats() external view returns (UserStats memory) {
        return userStats[msg.sender];
    }
    
    /**
     * @notice Get total number of tasks for caller
     * @return Total count including deleted tasks
     */
    function getTasksCount() external view returns (uint256) {
        return userTasks[msg.sender].length;
    }
    
    /**
     * @notice Get all tasks shared with the caller
     * @return Array of task metadata for shared tasks
     */
    function getSharedTasks() external view returns (TaskMetadata[] memory) {
        SharedTaskReference[] storage refs = sharedWithMe[msg.sender];
        TaskMetadata[] memory metadata = new TaskMetadata[](refs.length);
        
        for (uint256 i = 0; i < refs.length; i++) {
            Task storage task = userTasks[refs[i].owner][refs[i].taskId];
            
            // Only include if task still exists
            if (task.owner != address(0)) {
                metadata[i] = TaskMetadata({
                    id: refs[i].taskId,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    category: task.category,
                    tags: task.tags,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    completedAt: task.completedAt,
                    chunkCount: task.chunkCount,
                    isArchived: task.isArchived,
                    isFavorite: task.isFavorite,
                    color: task.color,
                    owner: refs[i].owner
                });
            }
        }
        
        return metadata;
    }
    
    /**
     * @notice Get encrypted content of a shared task
     * @param owner Address of the task owner
     * @param taskId ID of the task
     * @return handles Array of encrypted chunk handles
     * @return metadata Task metadata
     */
    function getSharedTaskContent(address owner, uint256 taskId) 
        external 
        view 
        returns (bytes32[] memory handles, TaskMetadata memory metadata) 
    {
        require(owner != address(0), "Invalid owner");
        require(taskId < userTasks[owner].length, "Task does not exist");
        
        Task storage task = userTasks[owner][taskId];
        require(task.owner != address(0), "Task deleted");
        
        // Verify this task was shared with caller
        bool isShared = false;
        SharedTaskReference[] storage refs = sharedWithMe[msg.sender];
        for (uint256 i = 0; i < refs.length; i++) {
            if (refs[i].owner == owner && refs[i].taskId == taskId) {
                isShared = true;
                break;
            }
        }
        require(isShared, "Task not shared with you");
        
        handles = new bytes32[](task.chunkCount);
        for (uint256 i = 0; i < task.chunkCount; i++) {
            handles[i] = FHE.toBytes32(task.encryptedDescription[i]);
        }
        
        metadata = TaskMetadata({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            category: task.category,
            tags: task.tags,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            completedAt: task.completedAt,
            chunkCount: task.chunkCount,
            isArchived: task.isArchived,
            isFavorite: task.isFavorite,
            color: task.color,
            owner: owner
        });
    }
}
