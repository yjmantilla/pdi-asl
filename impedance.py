import cv2
import matplotlib.pyplot as plt
import numpy as np
import os
import shutil


def get_inside(img):
    # original img
    #cv2.imshow("Input img", img)

    # Threshold to get the white stuff
    imgray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    #plt.imshow(imgray)
    ret, thresh = cv2.threshold(imgray, 250, 255, cv2.THRESH_BINARY)
    #cv2.imshow('',thresh)


    #plt.show()
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    output = img
    if len(contours) != 0:
        # draw in blue the contours that were founded
        #cv2.drawContours(output, contours, -1, 255, 3)

        # find the biggest countour (c) by the area
        c = max(contours, key = cv2.contourArea)
        x,y,w,h = cv2.boundingRect(c)
        cropped_image = img[y:y+h, x:x+w]
        contour_sizes = [cv2.contourArea(contour) for contour in contours]
        biggest_contour = max(contour_sizes)
        # draw the biggest contour (c) in green
        #cv2.rectangle(img,(x,y),(x+w,y+h),(0,255,0),2)

        # cv2.imshow("Result", np.hstack([img, output]))

        # cnt = contours[0]
        # cv2.drawContours(img, [cnt], 0, (0,255,0), 3)
        idx = contour_sizes.index(biggest_contour)
        # The index of the contour that surrounds your object
        mask = np.zeros_like(imgray) # Create mask where white is what we want, black otherwise
        cv2.drawContours(mask, contours, idx, 255, -1) # Draw filled contour in mask

        
        #cv2.imshow("Input img", mask)
        out = np.zeros_like(img) # Extract out the object and place into output imgs
        out[mask == 255] = img[mask == 255]
        #cv2.imshow("Input img", out)
        #cv2.waitKey()
        return out,cropped_image


import os.path
listOfFiles = [f for f in os.listdir('images')]
if os.path.isdir('.rois'):
    shutil.rmtree('.rois')

for image in listOfFiles:
    name,ext=os.path.splitext(image)
    folder = os.path.join('.rois',name+'_'+ext)
    img = cv2.imread(os.path.join('images',image))

    _,img = get_inside(img) # keep the cropped
    original = img.copy()
    # cv2.imshow('s',img)
    # cv2.waitKey()

    z_colors = [(255,0,255),
    (128,0,128),
    (0,0,255)  ,
    (0,0,192)  ,
    (0,0,128)  ,
    (0,128,192),
    (0,192,192),
    (0,255,0)  ,
    (0,192,0)  ,
    (0,128,0)  ,
    (192,192,0),
    (255,0,0)  ,
    (192,0,0)  ,
    (128,0,0)  ,
    (63,0,0)   ]

    k = 1000
    z_values = [50*k  ,
    46.8*k,
    43.6*k,
    40.4*k,
    37.1*k,
    33.9*k,
    30.7*k,
    27.5*k,
    24.3*k,
    21.1*k,
    17.9*k,
    14.6*k,
    11.4*k,
    8.2*k ,
    5*k   ]

    def get_dist(a,o):
        ds = []
        for i,_ in enumerate(a):
            ds.append( (a[i]-o[i])**2)
        
        return np.sqrt(np.sum(ds))

    def z_mapping(bgr,z_colors,z_values,radii=0):
        dists = [get_dist(bgr,o) for o in z_colors]
        idx = np.argmin(dists)
        return z_values[idx],np.min(dists)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # cv2.imshow('s',gray)
    # cv2.waitKey()

    blurred = gray.copy()
    # blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    # blurred = cv2.GaussianBlur(blurred, (3, 3), 0)
    # blurred = cv2.GaussianBlur(blurred, (3, 3), 0)

    # cv2.imshow('s',blurred)
    # cv2.waitKey()

    canny = cv2.Canny(blurred, 200, 255, 1)
    # cv2.imshow('s',canny)
    # cv2.waitKey()
    kernel = np.ones((5,5),np.uint8)
    dilate = canny.copy()#cv2.dilate(canny, kernel, iterations=2)
    #set(dilate.flatten().tolist())
    #dilate[np.where(dilate == 255)] = [0]
    #im[np.all(im == (0, 255, 0), axis=-1)] = (255,255,255)
    #cv2.imshow('s',dilate)
    #cv2.waitKey()

    # Find contours
    #cnts = cv2.findContours(dilate, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cv2.findContours(dilate, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    #cnts = cv2.findContours(dilate, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]

    os.makedirs(folder,exist_ok=True)

    # Iterate thorugh contours and filter for ROI
    img_number = 0
    contour_sizes = [cv2.contourArea(contour) for contour in cnts]
    contour_areas =[]
    for c in cnts:
        _,_,w,h =cv2.boundingRect(c)
        contour_areas.append(w*h)

    #plt.boxplot(contour_sizes)
    # show plot
    #plt.show()

    def foo(area,low=700,high=3000):
        if area > low and area < high:
            return True
        else:
            return False

    cnts = [c  for i,c in enumerate(cnts) if foo(contour_areas[i]) ]

    contour_sizes = [cv2.contourArea(contour) for contour in cnts]
    contour_areas =[]
    for c in cnts:
        _,_,w,h =cv2.boundingRect(c)
        contour_areas.append(w*h)


    insides =[]
    radii = 10
    for i,c in enumerate(cnts):
        x,y,w,h = cv2.boundingRect(c)
        cv2.rectangle(img, (x, y), (x + w, y + h), (36,255,12), 1)
        ROI = dilate[y:y+h, x:x+w]
        dilate2 = cv2.dilate(ROI, kernel, iterations=2)

        # cnts2,_ = cv2.findContours(ROI, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

        # # maybe i cant discriminate by color/contour because they may have the same color
        # if len(cnts2):
        #     cnts3 = cv2.findContours(ROI, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        ROI = original[y:y+h, x:x+w]

        # discrimination by color does not work, they may have the same color
        #colors = np.unique(ROI.copy().reshape(-1, ROI.shape[-1]), axis=0, return_counts=False).shape[0]
        #insides.append((len(cnts2),colors))
        

        #discriminate by size and split in the y middle
        if contour_areas[i] > 1500:
            ROI1 = original[y:y+h//2, x+int(np.floor(w*0.25)):x+w]
            ROI2 = original[y+h//2:y+h, x:x+int(np.floor(w*0.75))]
            ROIS = [ROI1,ROI2]
            #insides.append((len(cnts2),colors))
        else:
            ROIS = [ROI]
        chars =[]
        for j,r in enumerate(ROIS):
            colors,counts = np.unique(r.copy().reshape(-1, r.shape[-1]), axis=0, return_counts=True)
            index=np.argmax(counts)
            color = colors[index]
            z,mindist = z_mapping(color,z_colors,z_values)
            insides.append((i,j,z,mindist))
            cv2.imwrite(os.path.join(folder,"ROI_{}_{}__{}_{}.png".format(i,j,z,mindist)), r)

    #cv2.imshow('canny', canny)
    #cv2.imshow('img', img)
    #cv2.waitKey(0)