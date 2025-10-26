// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint32, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedFeedback
 * @notice Anonymous feedback collection system using Zama FHE
 * @dev Owners create feedback boxes, anyone can submit encrypted feedback anonymously
 */
contract EncryptedFeedback is SepoliaConfig {
    
    // ============ Enums ============
    
    enum Sentiment { Positive, Neutral, Negative }
    enum BoxCategory { Team, Product, Event, Course, General }
    
    // ============ Structs ============
    
    struct FeedbackBox {
        uint256 id;
        address owner;
        string title;
        string description;
        BoxCategory category;
        bool isActive;
        uint256 createdAt;
        uint256 closedAt;
        uint256 submissionCount;
        bool allowRatings;
        bool allowSentiment;
    }
    
    struct Feedback {
        uint256 id;
        uint256 boxId;
        euint32[] encryptedContent;  // Encrypted feedback text
        uint8 rating;                 // 0-5 (0 = no rating)
        Sentiment sentiment;
        uint256 submittedAt;
        bool isRead;
        uint8 chunkCount;
    }
    
    struct FeedbackMetadata {
        uint256 id;
        uint256 boxId;
        uint8 rating;
        Sentiment sentiment;
        uint256 submittedAt;
        bool isRead;
        uint8 chunkCount;
    }
    
    struct BoxStats {
        uint256 totalSubmissions;
        uint256 unreadCount;
        uint256 avgRating;           // Scaled by 100 (e.g., 425 = 4.25)
        uint256 positiveCount;
        uint256 neutralCount;
        uint256 negativeCount;
    }
    
    // ============ Storage ============
    
    mapping(address => FeedbackBox[]) private ownerBoxes;
    mapping(uint256 => mapping(uint256 => Feedback)) private boxFeedback; // boxGlobalId => feedbackId => Feedback
    mapping(uint256 => uint256) private feedbackCountPerBox;
    mapping(uint256 => address) private boxOwners; // Global box ID to owner
    
    uint256 private globalBoxCounter;
    uint256 public constant MAX_CHUNKS_PER_FEEDBACK = 128;  // ~512 bytes max
    uint256 public constant MAX_BOXES_PER_OWNER = 100;
    
    // ============ Events ============
    
    event BoxCreated(address indexed owner, uint256 indexed boxId, string title, BoxCategory category);
    event BoxClosed(address indexed owner, uint256 indexed boxId);
    event BoxReopened(address indexed owner, uint256 indexed boxId);
    event FeedbackSubmitted(uint256 indexed boxId, uint256 indexed feedbackId, uint8 rating, Sentiment sentiment);
    event FeedbackRead(uint256 indexed boxId, uint256 indexed feedbackId);
    event FeedbackDeleted(uint256 indexed boxId, uint256 indexed feedbackId);
    
    // ============ Modifiers ============
    
    modifier boxExists(uint256 boxId) {
        require(boxId < ownerBoxes[msg.sender].length, "Box does not exist");
        _;
    }
    
    modifier boxIsActive(uint256 globalBoxId) {
        address owner = boxOwners[globalBoxId];
        require(owner != address(0), "Box does not exist");
        
        // Find the box in owner's array
        FeedbackBox[] storage boxes = ownerBoxes[owner];
        bool found = false;
        for (uint256 i = 0; i < boxes.length; i++) {
            if (boxes[i].id == globalBoxId) {
                require(boxes[i].isActive, "Box is closed");
                found = true;
                break;
            }
        }
        require(found, "Box not found");
        _;
    }
    
    modifier onlyBoxOwner(uint256 globalBoxId) {
        require(boxOwners[globalBoxId] == msg.sender, "Not box owner");
        _;
    }
    
    // ============ Box Management Functions ============
    
    /**
     * @notice Create a new feedback box
     */
    function createBox(
        string calldata title,
        string calldata description,
        BoxCategory category,
        bool allowRatings,
        bool allowSentiment
    ) external returns (uint256) {
        require(ownerBoxes[msg.sender].length < MAX_BOXES_PER_OWNER, "Max boxes reached");
        require(bytes(title).length > 0, "Title required");
        
        uint256 globalBoxId = globalBoxCounter++;
        
        FeedbackBox memory newBox = FeedbackBox({
            id: globalBoxId,
            owner: msg.sender,
            title: title,
            description: description,
            category: category,
            isActive: true,
            createdAt: block.timestamp,
            closedAt: 0,
            submissionCount: 0,
            allowRatings: allowRatings,
            allowSentiment: allowSentiment
        });
        
        ownerBoxes[msg.sender].push(newBox);
        boxOwners[globalBoxId] = msg.sender;
        
        emit BoxCreated(msg.sender, globalBoxId, title, category);
        
        return globalBoxId;
    }
    
    /**
     * @notice Close a feedback box (stop accepting submissions)
     */
    function closeBox(uint256 boxId) external boxExists(boxId) {
        FeedbackBox storage box = ownerBoxes[msg.sender][boxId];
        require(box.isActive, "Box already closed");
        
        box.isActive = false;
        box.closedAt = block.timestamp;
        
        emit BoxClosed(msg.sender, box.id);
    }
    
    /**
     * @notice Reopen a closed feedback box
     */
    function reopenBox(uint256 boxId) external boxExists(boxId) {
        FeedbackBox storage box = ownerBoxes[msg.sender][boxId];
        require(!box.isActive, "Box already active");
        
        box.isActive = true;
        box.closedAt = 0;
        
        emit BoxReopened(msg.sender, box.id);
    }
    
    /**
     * @notice Update box details
     */
    function updateBox(
        uint256 boxId,
        string calldata title,
        string calldata description
    ) external boxExists(boxId) {
        FeedbackBox storage box = ownerBoxes[msg.sender][boxId];
        
        if (bytes(title).length > 0) {
            box.title = title;
        }
        box.description = description;
    }
    
    // ============ Feedback Submission Functions ============
    
    /**
     * @notice Submit anonymous feedback to a box
     * @dev Anyone can submit, no wallet connection required for anonymity
     */
    function submitFeedback(
        uint256 globalBoxId,
        externalEuint32[] calldata encryptedChunks,
        bytes calldata inputProof,
        uint8 rating,
        Sentiment sentiment
    ) external boxIsActive(globalBoxId) returns (uint256) {
        require(encryptedChunks.length > 0 && encryptedChunks.length <= MAX_CHUNKS_PER_FEEDBACK, "Invalid chunk count");
        
        address owner = boxOwners[globalBoxId];
        FeedbackBox storage box = _findBox(owner, globalBoxId);
        
        if (box.allowRatings) {
            require(rating <= 5, "Rating must be 0-5");
        } else {
            rating = 0;
        }
        
        uint256 feedbackId = feedbackCountPerBox[globalBoxId]++;
        
        // Store encrypted feedback
        Feedback storage newFeedback = boxFeedback[globalBoxId][feedbackId];
        newFeedback.id = feedbackId;
        newFeedback.boxId = globalBoxId;
        newFeedback.rating = rating;
        newFeedback.sentiment = sentiment;
        newFeedback.submittedAt = block.timestamp;
        newFeedback.isRead = false;
        newFeedback.chunkCount = uint8(encryptedChunks.length);
        
        // Encrypt and store chunks
        for (uint256 i = 0; i < encryptedChunks.length; i++) {
            euint32 chunk = FHE.fromExternal(encryptedChunks[i], inputProof);
            FHE.allow(chunk, owner);
            FHE.allowThis(chunk);
            newFeedback.encryptedContent.push(chunk);
        }
        
        box.submissionCount++;
        
        emit FeedbackSubmitted(globalBoxId, feedbackId, rating, sentiment);
        
        return feedbackId;
    }
    
    // ============ Feedback Management Functions ============
    
    /**
     * @notice Mark feedback as read
     */
    function markAsRead(uint256 globalBoxId, uint256 feedbackId) external onlyBoxOwner(globalBoxId) {
        Feedback storage feedback = boxFeedback[globalBoxId][feedbackId];
        require(feedback.submittedAt > 0, "Feedback does not exist");
        
        feedback.isRead = true;
        
        emit FeedbackRead(globalBoxId, feedbackId);
    }
    
    /**
     * @notice Delete feedback (owner only)
     */
    function deleteFeedback(uint256 globalBoxId, uint256 feedbackId) external onlyBoxOwner(globalBoxId) {
        Feedback storage feedback = boxFeedback[globalBoxId][feedbackId];
        require(feedback.submittedAt > 0, "Feedback does not exist");
        
        // Clear encrypted content
        delete feedback.encryptedContent;
        feedback.chunkCount = 0;
        feedback.submittedAt = 0;
        
        emit FeedbackDeleted(globalBoxId, feedbackId);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all boxes owned by caller
     */
    function getMyBoxes() external view returns (FeedbackBox[] memory) {
        return ownerBoxes[msg.sender];
    }
    
    /**
     * @notice Get box details by global ID (public)
     */
    function getBoxDetails(uint256 globalBoxId) external view returns (FeedbackBox memory) {
        address owner = boxOwners[globalBoxId];
        require(owner != address(0), "Box does not exist");
        
        return _findBox(owner, globalBoxId);
    }
    
    /**
     * @notice Get all feedback metadata for a box (owner only)
     */
    function getBoxFeedback(uint256 globalBoxId) external view onlyBoxOwner(globalBoxId) returns (FeedbackMetadata[] memory) {
        uint256 count = feedbackCountPerBox[globalBoxId];
        FeedbackMetadata[] memory metadata = new FeedbackMetadata[](count);
        
        for (uint256 i = 0; i < count; i++) {
            Feedback storage feedback = boxFeedback[globalBoxId][i];
            if (feedback.submittedAt > 0) {  // Not deleted
                metadata[i] = FeedbackMetadata({
                    id: feedback.id,
                    boxId: feedback.boxId,
                    rating: feedback.rating,
                    sentiment: feedback.sentiment,
                    submittedAt: feedback.submittedAt,
                    isRead: feedback.isRead,
                    chunkCount: feedback.chunkCount
                });
            }
        }
        
        return metadata;
    }
    
    /**
     * @notice Get encrypted feedback content for decryption (owner only)
     */
    function getFeedbackContent(uint256 globalBoxId, uint256 feedbackId) 
        external 
        view 
        onlyBoxOwner(globalBoxId)
        returns (bytes32[] memory handles, FeedbackMetadata memory metadata) 
    {
        Feedback storage feedback = boxFeedback[globalBoxId][feedbackId];
        require(feedback.submittedAt > 0, "Feedback does not exist");
        
        handles = new bytes32[](feedback.encryptedContent.length);
        for (uint256 i = 0; i < feedback.encryptedContent.length; i++) {
            handles[i] = FHE.toBytes32(feedback.encryptedContent[i]);
        }
        
        metadata = FeedbackMetadata({
            id: feedback.id,
            boxId: feedback.boxId,
            rating: feedback.rating,
            sentiment: feedback.sentiment,
            submittedAt: feedback.submittedAt,
            isRead: feedback.isRead,
            chunkCount: feedback.chunkCount
        });
        
        return (handles, metadata);
    }
    
    /**
     * @notice Get statistics for a feedback box
     */
    function getBoxStats(uint256 globalBoxId) external view returns (BoxStats memory) {
        uint256 count = feedbackCountPerBox[globalBoxId];
        
        uint256 totalRating = 0;
        uint256 ratedCount = 0;
        uint256 positive = 0;
        uint256 neutral = 0;
        uint256 negative = 0;
        uint256 unread = 0;
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < count; i++) {
            Feedback storage feedback = boxFeedback[globalBoxId][i];
            if (feedback.submittedAt > 0) {  // Not deleted
                activeCount++;
                
                if (feedback.rating > 0) {
                    totalRating += feedback.rating;
                    ratedCount++;
                }
                
                if (feedback.sentiment == Sentiment.Positive) positive++;
                else if (feedback.sentiment == Sentiment.Neutral) neutral++;
                else if (feedback.sentiment == Sentiment.Negative) negative++;
                
                if (!feedback.isRead) unread++;
            }
        }
        
        uint256 avgRating = ratedCount > 0 ? (totalRating * 100) / ratedCount : 0;
        
        return BoxStats({
            totalSubmissions: activeCount,
            unreadCount: unread,
            avgRating: avgRating,
            positiveCount: positive,
            neutralCount: neutral,
            negativeCount: negative
        });
    }
    
    /**
     * @notice Get total number of boxes
     */
    function getTotalBoxes() external view returns (uint256) {
        return ownerBoxes[msg.sender].length;
    }
    
    /**
     * @notice Get total feedback count for a box
     */
    function getFeedbackCount(uint256 globalBoxId) external view returns (uint256) {
        return feedbackCountPerBox[globalBoxId];
    }
    
    // ============ Internal Helper Functions ============
    
    function _findBox(address owner, uint256 globalBoxId) private view returns (FeedbackBox storage) {
        FeedbackBox[] storage boxes = ownerBoxes[owner];
        for (uint256 i = 0; i < boxes.length; i++) {
            if (boxes[i].id == globalBoxId) {
                return boxes[i];
            }
        }
        revert("Box not found");
    }
}
