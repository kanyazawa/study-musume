
from PIL import Image, ImageDraw
import sys

def smart_remove_background(input_path, output_path, tolerance=30):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Get background color from top-left (assuming 0,0 is background)
        # You might want to check other corners if 0,0 is inclusive
        bg_ref = img.getpixel((0, 0))[:3]
        print(f"Background reference color: {bg_ref}")
        
        # Create a mask for flood filling
        # Image.floodfill (in newer Pillow) or manual BFS
        # We will use a manual BFS for control and older pillow compat if needed, 
        # but let's try a logic that marks connected background pixels.
        
        # Create a binary mask where 0=background candidate, 1=protected
        # But wait, floodfill is easier.
        # Let's use a queue-based flood fill.
        
        pixels = img.load()
        visited = set()
        queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)] # Start from corners
        
        # Helper to check color difference
        def is_bg_color(px):
            return all(abs(px[i] - bg_ref[i]) <= tolerance for i in range(3))

        # Check if corners are actually background before adding
        queue = [p for p in queue if is_bg_color(pixels[p])]
        
        seen_bg_pixels = set(queue)
        
        # Process queue
        full_queue = list(queue)
        idx = 0
        while idx < len(full_queue):
            x, y = full_queue[idx]
            idx += 1
            
            # Neighbors
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in seen_bg_pixels:
                        if is_bg_color(pixels[nx, ny]):
                            seen_bg_pixels.add((nx, ny))
                            full_queue.append((nx, ny))
                            
        # Now apply transparency only to seen_bg_pixels
        print(f"Detected {len(seen_bg_pixels)} background pixels.")
        
        for x, y in seen_bg_pixels:
            pixels[x, y] = (0, 0, 0, 0)
            
        img.save(output_path, "PNG")
        print(f"Successfully saved to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Input is the ORIGINAL uploaded image, not the already processed one which has lost info
    input_file = r"C:/Users/Hide2/.gemini/antigravity/brain/56a50dc2-cc27-4194-ac40-59861eb2c002/uploaded_image_1769170135489.jpg"
    output_file = r"c:/Users/Hide2/.gemini/study-musume/src/assets/images/character_casual_v3.png"
    
    smart_remove_background(input_path=input_file, output_path=output_file)
