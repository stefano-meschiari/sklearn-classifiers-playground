
import numpy as np
import matplotlib.pyplot as plt
from sklearn import datasets
from sklearn.gaussian_process import GaussianProcessClassifier
from sklearn.gaussian_process.kernels import RBF
import io, base64
import random


def compute_and_plot_gaussian_process():
    # import some data to play with
    (X, y) = datasets.make_classification(n_features=2, n_redundant=0, n_classes=3, n_clusters_per_class=1)

    h = 0.02  # step size in the mesh
    # create a mesh to plot in
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

    kernel = 1.0 * RBF([1.0])
    gpc_rbf_isotropic = GaussianProcessClassifier(kernel=kernel).fit(X, y)
    kernel = 1.0 * RBF([1.0, 1.0])
    gpc_rbf_anisotropic = GaussianProcessClassifier(kernel=kernel).fit(X, y)


    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

    titles = ["Isotropic RBF", "Anisotropic RBF"]
    plt.figure(figsize=(10, 5))
    for i, clf in enumerate((gpc_rbf_isotropic)):
        # Plot the predicted probabilities. For that, we will assign a color to
        # each point in the mesh [x_min, m_max]x[y_min, y_max].
        plt.subplot(1, 2, i + 1)

        Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])

        # Put the result into a color plot
        Z = Z.reshape((xx.shape[0], xx.shape[1], 3))
        plt.imshow(Z, extent=(x_min, x_max, y_min, y_max), origin="lower")

        # Plot also the training points
        plt.scatter(X[:, 0], X[:, 1], c=np.array(["r", "g", "b"])[y], edgecolors=(0, 0, 0))
        plt.xlabel("Feature 1")
        plt.ylabel("Feature 2")
        plt.xlim(xx.min(), xx.max())
        plt.ylim(yy.min(), yy.max())
        #plt.xticks(())
        #plt.yticks(())
        plt.title(
            "%s, LML: %.3f" % (titles[i], clf.log_marginal_likelihood(clf.kernel_.theta))
        )

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
