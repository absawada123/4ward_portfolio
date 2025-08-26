import os
from tkinter import Tk, filedialog, Button, Label, OptionMenu, StringVar
from PIL import Image, ImageOps

# --- Helper Function ---

def create_polaroid_frame(img, final_width, final_height):
    """
    Creates a fixed-size framed image with very thin side borders and wider top/bottom borders.
    This single function can create both portrait and landscape frames.
    """
    BORDER_COLOR = (255, 255, 255)  # White

    # --- BORDER VALUES UPDATED AS REQUESTED ---
    THIN_BORDER_SIDES = 12       # Halved from 30 to 15 for left and right
    WIDE_BORDER_TOP_BOTTOM = 40  # Kept the same for top and bottom

    # Calculate the size of the inner content area for the image
    content_width = final_width - (THIN_BORDER_SIDES * 2)
    content_height = final_height - (WIDE_BORDER_TOP_BOTTOM * 2)
    content_size = (content_width, content_height)

    # Resize and center-crop the input image to fill the content area
    processed_img = ImageOps.fit(
        img, 
        content_size, 
        method=Image.Resampling.LANCZOS, 
        centering=(0.5, 0.5)
    )

    # Create the final canvas, which is the white frame itself
    final_image = Image.new("RGB", (final_width, final_height), BORDER_COLOR)
    
    # Paste the processed image onto the frame
    paste_position = (THIN_BORDER_SIDES, WIDE_BORDER_TOP_BOTTOM)
    final_image.paste(processed_img, paste_position)
    
    return final_image


def generate_images():
    global selected_files
    if not selected_files:
        return
    
    export_choice = export_var.get()
    
    save_dir = filedialog.askdirectory(title="Select Output Folder")
    if not save_dir:
        return
    
    output_images = []
    for file in selected_files:
        img = Image.open(file)
        
        # --- ORIENTATION DETECTION LOGIC (UNCHANGED) ---
        width, height = img.size
        
        if height > width:
            # Image is PORTRAIT, create a portrait frame (e.g., 750x1000)
            framed_img = create_polaroid_frame(img, final_width=750, final_height=1000)
        else:
            # Image is LANDSCAPE or SQUARE, create a landscape frame (e.g., 1000x750)
            framed_img = create_polaroid_frame(img, final_width=1000, final_height=750)
        
        # Save as PNG for best quality
        filename, _ = os.path.splitext(os.path.basename(file))
        save_path = os.path.join(save_dir, filename + ".png")
        framed_img.save(save_path)
        
        output_images.append(framed_img)
    
    if export_choice == "PDF":
        if output_images:
            pdf_path = os.path.join(save_dir, "photocards.pdf")
            output_images[0].save(pdf_path, save_all=True, append_images=output_images[1:])
    
    status_label.config(text=f"Exported {len(output_images)} image(s) to {save_dir}")


def select_images():
    global selected_files
    selected_files = filedialog.askopenfilenames(title="Select Images",
                                                 filetypes=[("Image files", "*.jpg *.jpeg *.png")])
    if selected_files:
        status_label.config(text=f"{len(selected_files)} image(s) selected")

# --- GUI Setup ---
root = Tk()
root.title("Auto-Orienting Polaroid Framer")
root.geometry("400x250")

selected_files = []

# Style Information Label
Label(root, text="Style: Auto-Detecting Polaroid (Thin Sides)").pack(pady=10)

# Export format selector
export_var = StringVar(root)
export_var.set("Separate Images")
Label(root, text="Export Format:").pack(pady=5)
OptionMenu(root, export_var, "Separate Images", "PDF").pack()

# Buttons
Button(root, text="Select Images", command=select_images).pack(pady=10)
Button(root, text="Generate Images", command=generate_images).pack(pady=10)

# Status
status_label = Label(root, text="No images selected")
status_label.pack(pady=10)

root.mainloop()