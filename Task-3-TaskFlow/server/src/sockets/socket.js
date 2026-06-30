/**
 * Socket.io structure for real-time features (e.g. live Kanban updates,
 * live comments). Wired up in server.js but kept minimal here - extend
 * the event handlers below as real-time features are implemented.
 */
export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins a "room" named after the project ID so updates can be
    // broadcast only to users viewing that project's board.
    socket.on("joinProject", (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("leaveProject", (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Example event - emit this from taskController after a status change
    // to push live Kanban updates to everyone viewing the same project:
    //   io.to(`project:${task.project}`).emit("taskUpdated", task);
    socket.on("taskMoved", ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit("taskUpdated", task);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
