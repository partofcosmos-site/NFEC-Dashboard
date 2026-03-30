"""
NFEC Navigation Core (A* Pathfinding & Grid SLAM)
=================================================
In the `simulation.js`, the robot just steers towards the target using an Artificial Potential Field.
While simple, real robots get trapped in "local minima" (e.g. they get stuck in U-shaped corners).

To build a REAL robot, you need a Global Path Planner. 
This script demonstrates A* (A-Star), the industry standard algorithm for finding the shortest 
safe path around physical obstacles on an occupancy grid.
"""

import math
import heapq

# A simplified 2D Occupancy Grid representing the room.
# 0 = Free Space, 1 = Wall/Obstacle
# In a real robot, this grid is generated automatically by spinning LIDAR (called SLAM).
mock_occupancy_grid = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0], # Obstacle
    [0, 1, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 0], # Another Wall
    [0, 0, 0, 0, 0, 0, 0],
]

class AStarPlanner:
    def __init__(self, grid):
        self.grid = grid
        self.height = len(grid)
        self.width = len(grid[0])
        self.directions = [(0,1), (1,0), (0,-1), (-1,0), (1,1), (-1,-1), (1,-1), (-1,1)]

    def heuristic(self, a, b):
        # Euclidean distance to goal
        return math.hypot(b[0] - a[0], b[1] - a[1])

    def plan_path(self, start, goal):
        """
        Finds the shortest array of (x,y) waypoints around obstacles.
        """
        frontier = []
        heapq.heappush(frontier, (0, start))
        came_from = {start: None}
        cost_so_far = {start: 0}

        while frontier:
            _, current = heapq.heappop(frontier)

            if current == goal:
                break

            for dx, dy in self.directions:
                next_node = (current[0] + dx, current[1] + dy)
                
                # Boundary check
                if 0 <= next_node[0] < self.width and 0 <= next_node[1] < self.height:
                    # Obstacle check
                    if self.grid[next_node[1]][next_node[0]] == 1:
                        continue 
                    
                    new_cost = cost_so_far[current] + math.hypot(dx, dy)
                    if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                        cost_so_far[next_node] = new_cost
                        priority = new_cost + self.heuristic(goal, next_node)
                        heapq.heappush(frontier, (priority, next_node))
                        came_from[next_node] = current

        # Reconstruct path
        if goal not in came_from:
            return [] # No path found (Trapped!)

        path = []
        curr = goal
        while curr != start:
            path.append(curr)
            curr = came_from[curr]
        path.append(start)
        path.reverse()
        return path

if __name__ == "__main__":
    planner = AStarPlanner(mock_occupancy_grid)
    start_pos = (0, 0)
    target_pos = (6, 2)
    
    print("Calculating optimal route avoiding obstacles...")
    optimal_path = planner.plan_path(start_pos, target_pos)
    
    print(f"Generated Waypoints: {optimal_path}")
    print("A real robot follows these waypoints one-by-one using its PID controller.")
