import time
from PIL import Image, ImageFilter


def light_processing(image):
    image = image.filter(ImageFilter.BLUR)
    time.sleep(1)
    return image


def heavy_processing(image):
    image = image.filter(ImageFilter.CONTOUR)
    time.sleep(60)  ## To simulate a long processing time
    return image


def process_image(image_path, light=False, heavy=False):
    image = Image.open(image_path)
    if light:
        image = light_processing(image)
    if heavy:
        image = heavy_processing(image)
    output_path = image_path.with_stem(image_path.stem + "_Processed")
    image.save(output_path)
    return output_path


